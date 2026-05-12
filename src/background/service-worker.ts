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
      args: [config.projectId],
    });

    return { success: true, user: results[0]?.result ?? null };
  }

  if (message.type === 'SWITCH_USER') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectAuthInPage,
      args: [message.payload, config.projectId],
    });

    return { success: true, user: message.payload };
  }

  if (message.type === 'SIGN_OUT') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: clearCurrentUserInPage,
      args: [config.projectId],
    });

    return { success: true, user: null };
  }

  throw new Error('Unknown message type');
}

async function readCurrentUserInPage(
  projectId: string
): Promise<import('../lib/types').AuthState | null> {
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
      if ((cursor.key as string).startsWith('firebase:authUser:') &&
          (cursor.key as string).endsWith(`:${projectId}`)) {
        resolve(cursor.value.value);
      } else { cursor.continue(); }
    };
    req.onerror = () => reject(req.error);
  });
}

async function injectAuthInPage(
  state: import('../lib/types').AuthState,
  projectId: string
): Promise<void> {
  const DB_NAME = 'firebaseLocalStorageDb';
  const STORE_NAME = 'firebaseLocalStorage';

  const db: IDBDatabase = await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: 'fbase_key' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  const key = `firebase:authUser:${state.apiKey}:${projectId}`;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put({ fbase_key: key, value: state });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  location.reload();
}

async function clearCurrentUserInPage(projectId: string): Promise<void> {
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
      if ((cursor.key as string).startsWith('firebase:authUser:') &&
          (cursor.key as string).endsWith(`:${projectId}`)) {
        cursor.delete();
        resolve();
      } else { cursor.continue(); }
    };
    req.onerror = () => reject(req.error);
  });

  location.reload();
}
