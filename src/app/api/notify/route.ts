import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/supabase/server";
import { sendTelegram, telegramConfigured } from "@/lib/telegram";

export async function GET() {
  if (!(await requireOwner())) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  return NextResponse.json({ configured: telegramConfigured() });
}

export async function POST(req: Request) {
  if (!(await requireOwner())) return NextResponse.json({ ok: false, error: "Tidak diizinkan" }, { status: 403 });
  const { text } = (await req.json().catch(() => ({}))) as { text?: unknown };
  if (typeof text !== "string" || !text.trim() || text.length > 3500) {
    return NextResponse.json({ ok: false, error: "Teks tidak valid" }, { status: 400 });
  }
  const result = await sendTelegram(text.trim());
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
