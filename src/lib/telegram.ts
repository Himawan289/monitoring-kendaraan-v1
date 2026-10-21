import "server-only";

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Kirim ke chat tertentu; tanpa chatId dipakai TELEGRAM_CHAT_ID (chat admin). */
export async function sendTelegram(text: string, chatId: string | number | undefined = process.env.TELEGRAM_CHAT_ID): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return { ok: false, error: "Telegram belum dikonfigurasi" };
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: escapeHtml(text), parse_mode: "HTML" }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { description?: string } | null;
    return { ok: false, error: body?.description ?? `HTTP ${res.status}` };
  }
  return { ok: true };
}

let botUsername: string | undefined;

/** Username bot (tanpa @), untuk tautan t.me. */
export async function getBotUsername(): Promise<string | null> {
  if (botUsername) return botUsername;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`).catch(() => null);
  const body = (await res?.json().catch(() => null)) as { result?: { username?: string } } | null;
  botUsername = body?.result?.username;
  return botUsername ?? null;
}
