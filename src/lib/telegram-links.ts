import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getOwnerId } from "./server-state";

const CODE_TTL_MS = 10 * 60 * 1000;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Pengguna yang terhubung ke chat ini; chat admin (TELEGRAM_CHAT_ID) = pemilik. */
export async function userIdForChat(admin: SupabaseClient, chatId: number): Promise<string | null> {
  if (String(chatId) === process.env.TELEGRAM_CHAT_ID) return getOwnerId(admin);
  const { data } = await admin.from("telegram_links").select("user_id").eq("chat_id", chatId).maybeSingle();
  return (data?.user_id as string | undefined) ?? null;
}

/** Chat tujuan notifikasi untuk pengguna; null bila belum terhubung. */
export async function chatIdForUser(admin: SupabaseClient, userId: string): Promise<string | null> {
  if (userId === (await getOwnerId(admin)) && process.env.TELEGRAM_CHAT_ID) return process.env.TELEGRAM_CHAT_ID;
  const { data } = await admin.from("telegram_links").select("chat_id").eq("user_id", userId).maybeSingle();
  return data ? String(data.chat_id) : null;
}

/** Buat kode sekali pakai (menggantikan kode lama pengguna). */
export async function createLinkCode(admin: SupabaseClient, userId: string): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const code = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  const cleared = await admin.from("telegram_link_codes").delete().eq("user_id", userId);
  if (cleared.error) throw new Error(cleared.error.message);
  const { error } = await admin.from("telegram_link_codes").insert({ code, user_id: userId, expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString() });
  if (error) throw new Error(error.message);
  return code;
}

/** Tukar kode dengan tautan chat; true bila berhasil. Kode dihapus saat dipakai. */
export async function redeemLinkCode(admin: SupabaseClient, code: string, chatId: number): Promise<boolean> {
  const { data } = await admin.from("telegram_link_codes").delete().eq("code", code.toUpperCase()).select("user_id,expires_at");
  const row = data?.[0];
  if (!row || new Date(row.expires_at as string).getTime() < Date.now()) return false;
  await admin.from("telegram_links").delete().or(`user_id.eq.${row.user_id},chat_id.eq.${chatId}`);
  const { error } = await admin.from("telegram_links").insert({ chat_id: chatId, user_id: row.user_id });
  return !error;
}
