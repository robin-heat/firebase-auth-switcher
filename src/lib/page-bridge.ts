import type { AuthState } from './types';

// These functions are serialized and injected into the page — must be self-contained, no imports.

async function _readCurrentUserInPage(): Promise<AuthState | null> {
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

async function _injectAuthInPage(state: AuthState, configuredApiKey: string): Promise<void> {
  const DB_NAME = 'firebaseLocalStorageDb';
  const STORE_NAME = 'firebaseLocalStorage';

  const db: IDBDatabase = await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: 'fbase_key' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

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

async function _clearCurrentUserInPage(): Promise<void> {
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

async function getActiveTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

export async function readCurrentUser(): Promise<AuthState | null> {
  const tabId = await getActiveTabId();
  if (!tabId) return null;
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: _readCurrentUserInPage,
      args: [],
    });
    return results[0]?.result ?? null;
  } catch {
    return null;
  }
}

export async function injectAuth(state: AuthState, configuredApiKey: string): Promise<void> {
  const tabId = await getActiveTabId();
  if (!tabId) throw new Error('No active tab');
  await chrome.scripting.executeScript({
    target: { tabId },
    func: _injectAuthInPage,
    args: [state, configuredApiKey],
  });
}

export async function clearCurrentUser(): Promise<void> {
  const tabId = await getActiveTabId();
  if (!tabId) throw new Error('No active tab');
  await chrome.scripting.executeScript({
    target: { tabId },
    func: _clearCurrentUserInPage,
    args: [],
  });
}
