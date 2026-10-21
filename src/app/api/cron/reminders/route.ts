import { NextResponse } from "next/server";
import { allReminders, type Reminder } from "@/lib/reminders";
import { loadUserState } from "@/lib/server-state";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendTelegram } from "@/lib/telegram";
import { chatIdForUser } from "@/lib/telegram-links";

const TAX_MILESTONES = [30, 14, 7, 3, 1, 0];
const ICON = { ok: "🟢", warning: "🟡", overdue: "🔴" } as const;

/** Pajak hanya diingatkan pada H-30/14/7/3/1/0 lalu tiap hari saat lewat; pengingat lain tiap hari selama belum aman. */
function worthSending(r: Reminder) {
  if (r.level === "ok") return false;
  if (r.days === undefined) return true;
  return r.days < 0 || TAX_MILESTONES.includes(r.days);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const admin = supabaseAdmin();
  const { data: rows } = await admin.from("app_state").select("user_id");
  let sent = 0;
  for (const { user_id } of rows ?? []) {
    const chat = await chatIdForUser(admin, user_id as string);
    const state = chat ? await loadUserState(admin, user_id as string) : null;
    if (!chat || !state) continue;

    const blocks = state.root.vehicles
      .map((v) => ({ v, items: allReminders(v).filter(worthSending) }))
      .filter((b) => b.items.length)
      .map((b) => `🚗 ${b.v.vehicle.name}\n${b.items.map((r) => `${ICON[r.level]} ${r.title}: ${r.detail}`).join("\n")}`);
    if (!blocks.length) continue;
    if ((await sendTelegram(`🔔 Pengingat hari ini\n\n${blocks.join("\n\n")}`, chat)).ok) sent++;
  }
  return NextResponse.json({ ok: true, sent });
}
