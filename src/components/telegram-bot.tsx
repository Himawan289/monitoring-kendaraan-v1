"use client";
import { useEffect } from "react";
import { answerCommand } from "@/lib/bot-commands";
import { notify } from "@/lib/notify";
import { getRoot } from "@/lib/store";

const POLL_MS = 4000;

/** Menjawab pesan Telegram selama aplikasi terbuka; tidak merender apa pun. */
export function TelegramBot() {
  useEffect(() => {
    let stopped = false;
    let busy = false;
    const tick = async () => {
      if (busy || stopped || document.hidden) return;
      busy = true;
      try {
        const res = await fetch("/api/telegram/updates", { method: "POST" });
        const { messages = [] } = (await res.json()) as { messages?: string[] };
        for (const m of messages) await notify(answerCommand(m, getRoot()));
      } catch {
        // abaikan; coba lagi pada putaran berikutnya
      } finally {
        busy = false;
      }
    };
    fetch("/api/notify")
      .then((r) => r.json())
      .then((d) => {
        if (d.configured && !stopped) {
          tick();
          timer = setInterval(tick, POLL_MS);
        }
      })
      .catch(() => {});
    let timer: ReturnType<typeof setInterval> | undefined;
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);
  return null;
}
