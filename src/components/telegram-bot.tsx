"use client";
import { useEffect } from "react";
import { answerCommand } from "@/lib/bot-commands";
import { applyWrite, parseWrite, pickVehicle } from "@/lib/bot-write";
import { notify } from "@/lib/notify";
import { addVehicle, getRoot, removeVehicle, today, uid, updateVehicle } from "@/lib/store";

const POLL_MS = 4000;

/** Perintah tulis dieksekusi; hasilnya dikonfirmasi oleh notifikasi perubahan, jadi hanya error yang dibalas langsung. */
function handle(text: string): string | null {
  const parsed = parseWrite(text);
  if (!parsed) return answerCommand(text, getRoot());
  if ("error" in parsed) return parsed.error;
  if (parsed.cmd.kind === "add_vehicle") {
    addVehicle(parsed.cmd.name, parsed.cmd.type, parsed.cmd.plate);
    return null;
  }
  const v = pickVehicle(getRoot(), parsed.vehicleQuery);
  if (!v) return `Kendaraan "${parsed.vehicleQuery}" tidak ditemukan.`;
  if (parsed.cmd.kind === "delete_vehicle") return removeVehicle(v.id) ? null : "Kendaraan terakhir tidak bisa dihapus.";
  const res = applyWrite(parsed.cmd, v, today(), uid);
  if ("error" in res) return res.error;
  updateVehicle(v.id, res.next);
  return res.note ?? null;
}

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
        for (const m of messages) {
          const reply = handle(m);
          if (reply) await notify(reply);
        }
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
