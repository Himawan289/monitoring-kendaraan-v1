"use client";
import { useEffect, useState } from "react";

const DB_NAME = "monitoring-kendaraan-photos";
const STORE = "photos";
const MAX_SIDE = 1280;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = run(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

/** Perkecil lalu simpan; mengembalikan id foto. */
export async function savePhoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/jpeg", 0.8));
  const id = crypto.randomUUID();
  await tx("readwrite", (s) => s.put(blob, id));
  return id;
}

export function getPhoto(id: string): Promise<Blob | undefined> {
  return tx<Blob | undefined>("readonly", (s) => s.get(id));
}

export async function deletePhotos(ids: string[]) {
  try {
    await Promise.all(ids.map((id) => tx("readwrite", (s) => s.delete(id))));
  } catch {
    // foto yatim tidak berbahaya
  }
}

export function usePhotoUrl(id: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let revoked: string | null = null;
    let alive = true;
    getPhoto(id)
      .then((b) => {
        if (!b || !alive) return;
        revoked = URL.createObjectURL(b);
        setUrl(revoked);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [id]);
  return url;
}
