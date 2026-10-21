import { NextResponse } from "next/server";
import { describeChanges } from "@/lib/changes";
import { runBotMessage } from "@/lib/bot-handler";
import { photoIds } from "@/lib/root-ops";
import { getOwnerId, mutateUserState } from "@/lib/server-state";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendTelegram } from "@/lib/telegram";
import { redeemLinkCode, userIdForChat } from "@/lib/telegram-links";

type Update = { message?: { text?: string; chat?: { id: number; type?: string } } };

const LINK_CMD = /^\/(?:start|hubungkan)(?:@\w+)?\s+([A-Za-z0-9]{6,16})\s*$/i;
const HOW_TO_LINK = "Chat ini belum terhubung ke akun. Buka website → Pengaturan → Hubungkan Telegram, lalu kirim kode yang muncul ke sini: /hubungkan KODE";

/** Telegram memanggil endpoint ini; hanya chat pribadi dengan secret token yang benar yang diproses. */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = (await req.json().catch(() => ({}))) as Update;
  const text = update.message?.text;
  const chat = update.message?.chat;
  if (!text || !chat || chat.type !== "private") return NextResponse.json({ ok: true });

  const admin = supabaseAdmin();
  const code = LINK_CMD.exec(text)?.[1];
  if (code) {
    const ok = await redeemLinkCode(admin, code, chat.id);
    await sendTelegram(ok ? "✅ Terhubung. Ketik /bantuan untuk melihat perintah." : "Kode tidak valid atau sudah kedaluwarsa. Buat kode baru di Pengaturan.", chat.id);
    return NextResponse.json({ ok: true });
  }

  // semua chat yang terhubung memakai data bersama milik pemilik
  const allowed = await userIdForChat(admin, chat.id);
  const userId = allowed ? await getOwnerId(admin) : null;
  if (!userId) {
    await sendTelegram(allowed ? "⚠️ Data keluarga belum tersedia." : HOW_TO_LINK, chat.id);
    return NextResponse.json({ ok: true });
  }

  const done = await mutateUserState(userId, (root) => {
    const r = runBotMessage(text, root, { today: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }), id: () => crypto.randomUUID() });
    return { root: r.root, result: r.reply };
  });
  if (!done) {
    await sendTelegram("⚠️ Data belum bisa diakses. Masuk ke website setidaknya sekali, lalu coba lagi.", chat.id);
    return NextResponse.json({ ok: true });
  }

  const lines = describeChanges(done.before, done.after);
  const out = [done.result, ...lines].filter(Boolean).join("\n");
  if (out) await sendTelegram(out.length > 3500 ? out.slice(0, 3490) + "…" : out, chat.id);

  // foto yang tidak dipakai lagi (mis. kendaraan dihapus)
  const keep = photoIds(done.after);
  const orphan = [...photoIds(done.before)].filter((id) => !keep.has(id));
  if (orphan.length) await admin.storage.from("photos").remove(orphan.map((id) => `${userId}/${id}.jpg`));
  return NextResponse.json({ ok: true });
}
