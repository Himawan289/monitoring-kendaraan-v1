import { NextResponse } from "next/server";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { sendTelegram, telegramConfigured } from "@/lib/telegram";
import { chatIdForUser } from "@/lib/telegram-links";

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const chat = await chatIdForUser(supabaseAdmin(), auth.user.id);
  const viaEnv = Boolean(chat) && chat === process.env.TELEGRAM_CHAT_ID;
  return NextResponse.json({ configured: telegramConfigured(), linked: Boolean(chat), viaEnv });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ ok: false, error: "Belum login" }, { status: 401 });
  const { text } = (await req.json().catch(() => ({}))) as { text?: unknown };
  if (typeof text !== "string" || !text.trim() || text.length > 3500) {
    return NextResponse.json({ ok: false, error: "Teks tidak valid" }, { status: 400 });
  }
  const chat = await chatIdForUser(supabaseAdmin(), auth.user.id);
  if (!chat) return NextResponse.json({ ok: false, error: "Telegram belum terhubung" }, { status: 409 });
  const result = await sendTelegram(text.trim(), chat);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
