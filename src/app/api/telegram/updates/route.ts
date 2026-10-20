import { NextResponse } from "next/server";

type Update = { update_id: number; message?: { text?: string; chat?: { id: number } } };

const g = globalThis as { __tgOffset?: number };

/** Ambil pesan baru dari Telegram (hanya dari chat milik Anda). Dipanggil berkala oleh aplikasi yang sedang terbuka. */
export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return NextResponse.json({ messages: [] });

  const qs = new URLSearchParams({ timeout: "0", allowed_updates: JSON.stringify(["message"]) });
  if (g.__tgOffset) qs.set("offset", String(g.__tgOffset));
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?${qs}`, { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return NextResponse.json({ messages: [] });

  const { result } = (await res.json()) as { result?: Update[] };
  const updates = result ?? [];
  if (updates.length) g.__tgOffset = Math.max(...updates.map((u) => u.update_id)) + 1;

  const messages = updates
    .filter((u) => String(u.message?.chat?.id) === chatId && u.message?.text)
    .map((u) => u.message!.text as string);
  return NextResponse.json({ messages });
}
