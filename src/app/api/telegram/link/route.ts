import { NextResponse } from "next/server";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { getBotUsername } from "@/lib/telegram";
import { createLinkCode } from "@/lib/telegram-links";

/** Buat kode penghubung Telegram untuk pengguna yang sedang login. */
export async function POST() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const code = await createLinkCode(supabaseAdmin(), auth.user.id);
  return NextResponse.json({ code, bot: await getBotUsername() });
}

/** Putuskan Telegram milik pengguna (chat admin dikelola lewat env, bukan tabel). */
export async function DELETE() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  await supabaseAdmin().from("telegram_links").delete().eq("user_id", auth.user.id);
  return NextResponse.json({ ok: true });
}
