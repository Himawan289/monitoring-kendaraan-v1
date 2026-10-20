"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "./supabase/client";

const BUCKET = "photos";
const MAX_SIDE = 1280;

async function ownerPrefix(): Promise<string> {
  const { data } = await supabaseBrowser().auth.getSession();
  if (!data.session) throw new Error("belum login");
  return data.session.user.id;
}

/** Perkecil lalu unggah ke Supabase Storage; mengembalikan id foto. */
export async function savePhoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/jpeg", 0.8));
  const id = crypto.randomUUID();
  const { error } = await supabaseBrowser().storage.from(BUCKET).upload(`${await ownerPrefix()}/${id}.jpg`, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return id;
}

export async function deletePhotos(ids: string[]) {
  if (!ids.length) return;
  try {
    const prefix = await ownerPrefix();
    await supabaseBrowser().storage.from(BUCKET).remove(ids.map((id) => `${prefix}/${id}.jpg`));
  } catch {
    // foto yatim tidak berbahaya
  }
}

export function usePhotoUrl(id: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let revoked: string | null = null;
    let alive = true;
    ownerPrefix()
      .then((prefix) => supabaseBrowser().storage.from(BUCKET).download(`${prefix}/${id}.jpg`))
      .then(({ data }) => {
        if (!data || !alive) return;
        revoked = URL.createObjectURL(data);
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
