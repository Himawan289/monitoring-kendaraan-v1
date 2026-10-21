"use client";

let cached: Promise<string> | null = null;

/** Id pemilik data bersama (folder foto dan baris app_state); sama untuk semua pengguna. */
export function getFamilyId(): Promise<string> {
  cached ??= fetch("/api/family")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("gagal memuat keluarga"))))
    .then((d: { id: string }) => d.id)
    .catch((e) => {
      cached = null;
      throw e;
    });
  return cached;
}
