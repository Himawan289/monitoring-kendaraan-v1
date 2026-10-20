import { fuelStats } from "./fuel";
import { WRITE_HELP } from "./bot-write";
import { allReminders, currentOdometer, serviceReminder, taxReminder, tireReminder, type Reminder } from "./reminders";
import type { Level, Root, Vehicle } from "./types";

const ICON: Record<Level, string> = { ok: "🟢", warning: "🟡", overdue: "🔴" };

const HELP = [
  "Perintah yang tersedia:",
  "odometer — kilometer terakhir",
  "status — ringkasan semua pengingat",
  "oli — jadwal ganti oli",
  "servis — jadwal servis berkala",
  "pajak — pajak tahunan & STNK",
  "ban — tekanan ban",
  "bbm — konsumsi & biaya BBM",
  "kendaraan — daftar kendaraan",
  "",
  "Tambahkan nama kendaraan untuk menyaring, contoh: odometer nmax",
  "",
  WRITE_HELP,
].join("\n");

const line = (r: Reminder) => `${ICON[r.level]} ${r.title}: ${r.detail}`;

function lastOdometerDate(v: Vehicle) {
  return [...v.odometerLogs].sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
}

function section(v: Vehicle, rows: string[]) {
  return [`🚗 ${v.vehicle.name}${v.vehicle.plate ? ` (${v.vehicle.plate})` : ""}`, ...rows].join("\n");
}

/** Jawaban untuk pesan Telegram; hanya membaca data, tidak mengubahnya. */
export function answerCommand(text: string, root: Root): string {
  const [first, ...rest] = text.trim().toLowerCase().replace(/^\//, "").replace(/@\w+/, "").split(/\s+/);
  const filter = rest.join(" ");
  const vehicles = filter ? root.vehicles.filter((v) => v.vehicle.name.toLowerCase().includes(filter)) : root.vehicles;

  if (["start", "help", "bantuan", "menu"].includes(first)) return HELP;
  if (vehicles.length === 0) return `Kendaraan "${filter}" tidak ditemukan.`;

  const per = (rows: (v: Vehicle) => string[]) => vehicles.map((v) => section(v, rows(v))).join("\n\n");

  switch (first) {
    case "kendaraan":
      return root.vehicles.map((v) => `• ${v.vehicle.name} (${v.vehicle.type === "mobil" ? "mobil" : "motor"})`).join("\n");
    case "odometer":
    case "km":
      return per((v) => {
        const d = lastOdometerDate(v);
        return [`📟 ${currentOdometer(v).toLocaleString("id-ID")} km${d ? ` (dicatat ${d})` : ""}`];
      });
    case "bbm":
      return per((v) => {
        const st = fuelStats(v.fuelLogs);
        if (!v.fuelLogs.length) return ["⛽ Belum ada catatan BBM."];
        return [
          `⛽ ${st.avgKmPerL ? `${st.avgKmPerL.toFixed(1)} km/L` : "km/L belum bisa dihitung"}${st.costPerKm ? ` · Rp ${Math.round(st.costPerKm).toLocaleString("id-ID")}/km` : ""}`,
          `Total: ${st.totalLiters.toLocaleString("id-ID")} L · Rp ${st.totalCost.toLocaleString("id-ID")}`,
        ];
      });
    case "status":
      return per((v) => allReminders(v).map(line));
    case "oli":
      return per((v) => [line(serviceReminder(v, "oli"))]);
    case "servis":
      return per((v) => [line(serviceReminder(v, "servis"))]);
    case "pajak":
      return per((v) => [line(taxReminder("Pajak tahunan", v.taxes.annualDue)), line(taxReminder("STNK 5 tahunan", v.taxes.stnkDue))]);
    case "ban":
      return per((v) => [line(tireReminder(v))]);
    default:
      return `Perintah tidak dikenal.\n\n${HELP}`;
  }
}
