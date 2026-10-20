import { answerCommand } from "./bot-commands";
import { applyWrite, parseWrite, pickVehicle } from "./bot-write";
import { addVehicleToRoot, removeVehicleFromRoot, updateVehicleInRoot } from "./root-ops";
import type { Root } from "./types";

export interface BotCtx {
  today: string;
  id: () => string;
}

/** Proses satu pesan Telegram secara murni: kembalikan data baru (bila berubah) dan balasan langsung (bila ada). */
export function runBotMessage(text: string, root: Root, ctx: BotCtx): { root: Root; reply: string | null } {
  const parsed = parseWrite(text);
  if (!parsed) return { root, reply: answerCommand(text, root) };
  if ("error" in parsed) return { root, reply: parsed.error };

  if (parsed.cmd.kind === "add_vehicle") {
    const { name, type, plate } = parsed.cmd;
    return { root: addVehicleToRoot(root, ctx.id(), name, type, plate), reply: null };
  }

  const v = pickVehicle(root, parsed.vehicleQuery);
  if (!v) return { root, reply: `Kendaraan "${parsed.vehicleQuery}" tidak ditemukan.` };

  if (parsed.cmd.kind === "delete_vehicle") {
    const next = removeVehicleFromRoot(root, v.id);
    return next ? { root: next, reply: null } : { root, reply: "Kendaraan terakhir tidak bisa dihapus." };
  }

  const res = applyWrite(parsed.cmd, v, ctx.today, ctx.id);
  if ("error" in res) return { root, reply: res.error };
  return { root: updateVehicleInRoot(root, v.id, res.next), reply: res.note ?? null };
}
