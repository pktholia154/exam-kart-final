export const DB_NAME = "pdf-offline-db";
export const STORE_NAME = "pdfs";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = (e: any) => resolve(e.target.result);
    req.onerror = (e: any) => reject(e.target.error);
  });
}

export async function savePdfOffline(id: string, data: ArrayBuffer) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ id, data });
    req.onsuccess = () => resolve();
    req.onerror = (e: any) => reject(e.target.error);
  });
}

export async function getPdfOffline(id: string): Promise<ArrayBuffer | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = (e: any) => {
      if (e.target.result) resolve(e.target.result.data);
      else resolve(null);
    };
    req.onerror = (e: any) => reject(e.target.error);
  });
}

export async function isPdfOffline(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.count(id);
    req.onsuccess = (e: any) => resolve(e.target.result > 0);
    req.onerror = (e: any) => reject(e.target.error);
  });
}

export async function removePdfOffline(id: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = (e: any) => reject(e.target.error);
  });
}
