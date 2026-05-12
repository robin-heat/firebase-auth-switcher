import type { AuthState } from './types';

const DB_NAME = 'firebaseLocalStorageDb';
const STORE_NAME = 'firebaseLocalStorage';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'fbase_key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function authKey(apiKey: string, projectId: string): string {
  return `firebase:authUser:${apiKey}:${projectId}`;
}

export async function readAuth(
  apiKey: string,
  projectId: string
): Promise<AuthState | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(authKey(apiKey, projectId));
    req.onsuccess = () => resolve(req.result ? (req.result.value as AuthState) : null);
    req.onerror = () => reject(req.error);
  });
}

export async function writeAuth(state: AuthState, projectId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const key = authKey(state.apiKey, projectId);
    const req = tx.objectStore(STORE_NAME).put({ fbase_key: key, value: state });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAuth(apiKey: string, projectId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(authKey(apiKey, projectId));
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
