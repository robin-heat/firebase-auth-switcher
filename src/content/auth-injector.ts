const DB_NAME = 'firebaseLocalStorageDb';
const STORE_NAME = 'firebaseLocalStorage';

function openAuthDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'fbase_key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function injectAuth(
  state: import('../lib/types').AuthState,
  projectId: string
): Promise<void> {
  const db = await openAuthDb();
  const key = `firebase:authUser:${state.apiKey}:${projectId}`;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put({ fbase_key: key, value: state });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  location.reload();
}

export async function readCurrentUser(
  projectId: string
): Promise<import('../lib/types').AuthState | null> {
  const db = await openAuthDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) { resolve(null); return; }
      const key = cursor.key as string;
      if (key.startsWith('firebase:authUser:') && key.endsWith(`:${projectId}`)) {
        resolve(cursor.value.value as import('../lib/types').AuthState);
      } else {
        cursor.continue();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearCurrentUser(projectId: string): Promise<void> {
  const db = await openAuthDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) { resolve(); return; }
      const key = cursor.key as string;
      if (key.startsWith('firebase:authUser:') && key.endsWith(`:${projectId}`)) {
        cursor.delete();
        resolve();
      } else {
        cursor.continue();
      }
    };
    req.onerror = () => reject(req.error);
  });
  location.reload();
}
