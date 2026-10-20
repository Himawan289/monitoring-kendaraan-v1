import { NextResponse } from "next/server";
import { describeChanges } from "@/lib/changes";
import { runBotMessage } from "@/lib/bot-handler";
import { photoIds } from "@/lib/root-ops";
import { mutateOwnerState, getOwnerId } from "@/lib/server-state";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendTelegram } from "@/lib/telegram";

type Update = { message?: { text?: string; chat?: { id: number } } };

/** Telegram memanggil endpoint ini; hanya pesan dari chat pemilik dengan secret token yang benar yang diproses. */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = (await req.json().catch(() => ({}))) as Update;
  const text = update.message?.text;
  if (!text || String(update.message?.chat?.id) !== process.env.TELEGRAM_CHAT_ID) return NextResponse.json({ ok: true });

  const done = await mutateOwnerState((root) => {
    const r = runBotMessage(text, root, { today: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }), id: () => crypto.randomUUID() });
    return { root: r.root, result: r.reply };
  });
  if (!done) {
    await sendTelegram("⚠️ Data belum bisa diakses. Pastikan akun pemilik sudah dibuat dan masuk ke website setidaknya sekali.");
    return NextResponse.json({ ok: true });
  }

  const lines = describeChanges(done.before, done.after);
  const out = [done.result, ...lines].filter(Boolean).join("\n");
  if (out) await sendTelegram(out.length > 3500 ? out.slice(0, 3490) + "…" : out);

  // foto yang tidak dipakai lagi (mis. kendaraan dihapus)
  const keep = photoIds(done.after);
  const orphan = [...photoIds(done.before)].filter((id) => !keep.has(id));
  if (orphan.length) {
    const admin = supabaseAdmin();
    const owner = await getOwnerId(admin);
    if (owner) await admin.storage.from("photos").remove(orphan.map((id) => `${owner}/${id}.jpg`));
  }
  return NextResponse.json({ ok: true });
}
