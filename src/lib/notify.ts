"use client";

/** Kirim notifikasi Telegram; kegagalan tidak boleh mengganggu penyimpanan data. */
export async function notify(text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return (await res.json()) as { ok: boolean; error?: string };
  } catch {
    return { ok: false, error: "Gagal menghubungi server" };
  }
}

export { fmtKm } from "./format";
