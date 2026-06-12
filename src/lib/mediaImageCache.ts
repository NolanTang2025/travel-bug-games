const DB_NAME = "mnemo-media-cache";
const STORE = "images";
const DB_VERSION = 1;

/** One blob URL per storage path per tab — avoids re-decode on every list refresh. */
const objectUrlByPath = new Map<string, string>();

type CacheRow = {
  path: string;
  blob: Blob;
  updatedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "path" });
      }
    };
  });
}

async function readBlob(path: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(path);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const row = req.result as CacheRow | undefined;
        resolve(row?.blob ?? null);
      };
    });
  } catch {
    return null;
  }
}

async function writeBlob(path: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const row: CacheRow = { path, blob, updatedAt: Date.now() };
    const req = tx.objectStore(STORE).put(row);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

export async function removeCachedMedia(paths: string[]): Promise<void> {
  if (!paths.length) return;
  for (const path of paths) {
    revokeMediaObjectUrl(objectUrlByPath.get(path));
    objectUrlByPath.delete(path);
  }
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const path of paths) store.delete(path);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}

function rememberObjectUrl(storagePath: string, url: string) {
  const prev = objectUrlByPath.get(storagePath);
  if (prev && prev !== url) revokeMediaObjectUrl(prev);
  objectUrlByPath.set(storagePath, url);
  return url;
}

/** Blob URL from local IndexedDB — survives page refresh. */
export async function getCachedMediaObjectUrl(storagePath: string): Promise<string | null> {
  const sessionHit = objectUrlByPath.get(storagePath);
  if (sessionHit) return sessionHit;

  const blob = await readBlob(storagePath);
  if (!blob) return null;
  return rememberObjectUrl(storagePath, URL.createObjectURL(blob));
}

export async function cacheMediaFromSignedUrl(storagePath: string, signedUrl: string): Promise<string | null> {
  try {
    const res = await fetch(signedUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    await writeBlob(storagePath, blob);
    return rememberObjectUrl(storagePath, URL.createObjectURL(blob));
  } catch {
    return null;
  }
}

/** Cached blob URLs for many paths (no network). */
export async function getCachedMediaObjectUrls(
  storagePaths: string[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    storagePaths.map(async (path) => {
      const url = await getCachedMediaObjectUrl(path);
      if (url) out[path] = url;
    }),
  );
  return out;
}

export function revokeMediaObjectUrl(url: string | undefined) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function revokeMediaObjectUrls(urls: Record<string, string> | string[]) {
  const list = Array.isArray(urls) ? urls : Object.values(urls);
  for (const url of list) revokeMediaObjectUrl(url);
}
