import { NextResponse } from "next/server";
import { sendTelegram, telegramConfigured } from "@/lib/telegram";

export function GET() {
  return NextResponse.json({ configured: telegramConfigured() });
}

export async function POST(req: Request) {
  const { text } = (await req.json().catch(() => ({}))) as { text?: unknown };
  if (typeof text !== "string" || !text.trim() || text.length > 3500) {
    return NextResponse.json({ ok: false, error: "Teks tidak valid" }, { status: 400 });
  }
  const result = await sendTelegram(text.trim());
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
