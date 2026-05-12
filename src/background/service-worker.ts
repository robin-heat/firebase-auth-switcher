import type { MessageType, MessageResponse } from '../lib/types';
import { getConfig } from '../lib/storage';

chrome.runtime.onMessage.addListener(
  (message: MessageType, _sender, sendResponse: (r: MessageResponse) => void) => {
    handleMessage(message).then(sendResponse).catch((err: Error) => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
);

async function handleMessage(message: MessageType): Promise<MessageResponse> {
  const config = await getConfig();

  if (message.type === 'GET_CURRENT_USER') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return { success: true, user: null };

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: readCurrentUserInPage,
      args: [],
    });

    return { success: true, user: results[0]?.result ?? null };
  }

  if (message.type === 'SWITCH_USER') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectAuthInPage,
      args: [message.payload, config.firebaseApiKey],
    });

    return { success: true, user: message.payload };
  }

  if (message.type === 'SIGN_OUT') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: clearCurrentUserInPage,
      args: [],
    });

    return { success: true, user: null };
  }

  throw new Error('Unknown message type');
}

// These functions are serialized and injected into the page — must be self-contained.

async function readCurrentUserInPage(): Promise<import('../lib/types').AuthState | null> {
  const DB_NAME = 'firebaseLocalStorageDb';
  const STORE_NAME = 'firebaseLocalStorage';

  const db: IDBDatabase = await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: 'fbase_key' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) { resolve(null); return; }
      if ((cursor.key as string).startsWith('firebase:authUser:')) {
        resolve(cursor.value.value);
      } else { cursor.continue(); }
    };
    req.onerror = () => reject(req.error);
  });
}

async function injectAuthInPage(
  state: import('../lib/types').AuthState,
  configuredApiKey: string,
): Promise<void> {
  const DB_NAME = 'firebaseLocalStorageDb';
  const STORE_NAME = 'firebaseLocalStorage';

  const db: IDBDatabase = await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: 'fbase_key' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  // Detect the key format the app already uses (to get the real apiKey and app name).
  // Firebase SDK uses: firebase:authUser:{apiKey}:{appName} where appName is usually [DEFAULT].
  const existingKey: string | null = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) { resolve(null); return; }
      if ((cursor.key as string).startsWith('firebase:authUser:')) {
        resolve(cursor.key as string);
      } else { cursor.continue(); }
    };
    req.onerror = () => reject(req.error);
  });

  // Prefer: existing key (detects real apiKey/appName from the page).
  // Fallback: configuredApiKey from extension settings + [DEFAULT] app name.
  let key: string;
  let apiKey = configuredApiKey || state.apiKey;
  if (existingKey) {
    const prefixLen = 'firebase:authUser:'.length;
    const thirdColon = existingKey.indexOf(':', prefixLen);
    apiKey = existingKey.slice(prefixLen, thirdColon);
    key = existingKey;
  } else {
    key = `firebase:authUser:${apiKey}:[DEFAULT]`;
  }

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put({ fbase_key: key, value: { ...state, apiKey } });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  location.reload();
}

async function clearCurrentUserInPage(): Promise<void> {
  const DB_NAME = 'firebaseLocalStorageDb';
  const STORE_NAME = 'firebaseLocalStorage';

  const db: IDBDatabase = await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: 'fbase_key' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) { resolve(); return; }
      if ((cursor.key as string).startsWith('firebase:authUser:')) {
        cursor.delete();
        resolve();
      } else { cursor.continue(); }
    };
    req.onerror = () => reject(req.error);
  });

  location.reload();
}
