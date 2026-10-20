import { addDays, addMonths, differenceInCalendarDays, parseISO } from "date-fns";
import type { AppState, Level, ServiceLog } from "./types";

export interface Reminder {
  level: Level;
  title: string;
  detail: string;
}

const KM_WARN = 500;
const DAYS_WARN = 30;
export const TAX_MILESTONES = [30, 14, 7] as const;

export function currentOdometer(s: AppState): number {
  const kms = [...s.odometerLogs.map((l) => l.km), ...s.serviceLogs.map((l) => l.km)];
  return kms.length ? Math.max(...kms) : 0;
}

export function daysUntil(dateIso: string, now = new Date()): number {
  return differenceInCalendarDays(parseISO(dateIso), now);
}

/** Servis/oli berikutnya: tercapai lebih dulu antara interval km atau waktu. */
export function serviceReminder(
  s: AppState,
  type: ServiceLog["type"],
  now = new Date(),
): Reminder & { nextKm?: number; nextDate?: string; remainingKm?: number; remainingDays?: number } {
  const label = type === "oli" ? "Ganti oli" : "Servis berkala";
  const kmInt = type === "oli" ? s.settings.oilIntervalKm : s.settings.serviceIntervalKm;
  const monthInt = type === "oli" ? s.settings.oilIntervalMonths : s.settings.serviceIntervalMonths;
  const last = s.serviceLogs
    .filter((l) => l.type === type)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!last) {
    return { level: "warning", title: label, detail: "Belum ada riwayat. Catat servis pertama." };
  }
  const nextKm = last.km + kmInt;
  const nextDate = addMonths(parseISO(last.date), monthInt).toISOString().slice(0, 10);
  const remainingKm = nextKm - currentOdometer(s);
  const remainingDays = differenceInCalendarDays(parseISO(nextDate), now);

  const level: Level =
    remainingKm <= 0 || remainingDays < 0
      ? "overdue"
      : remainingKm <= KM_WARN || remainingDays <= DAYS_WARN
        ? "warning"
        : "ok";

  // mana yang tercapai lebih dulu: bandingkan sisa km (asumsi ~1.000 km/bulan ≈ 33 km/hari) dengan sisa hari
  const byKmFirst = remainingKm / 33 < remainingDays;
  const detail =
    level === "overdue"
      ? `Terlambat ${remainingKm <= 0 ? `${Math.abs(remainingKm).toLocaleString("id-ID")} km` : `${Math.abs(remainingDays)} hari`}`
      : byKmFirst
        ? `${remainingKm.toLocaleString("id-ID")} km lagi (di ${nextKm.toLocaleString("id-ID")} km)`
        : `${remainingDays} hari lagi (${nextDate})`;
  return { level, title: label, detail, nextKm, nextDate, remainingKm, remainingDays };
}

export function taxReminder(title: string, due: string, now = new Date()): Reminder & { days?: number } {
  if (!due) return { level: "warning", title, detail: "Tanggal jatuh tempo belum diisi" };
  const days = daysUntil(due, now);
  if (days < 0) return { level: "overdue", title, detail: `Lewat ${Math.abs(days)} hari`, days };
  const milestone = TAX_MILESTONES.find((m) => days <= m);
  // H-30 / H-14 / H-7 → kuning
  if (milestone !== undefined) return { level: "warning", title, detail: `H-${days} (tenggat ${due})`, days };
  return { level: "ok", title, detail: `${days} hari lagi (${due})`, days };
}

export function tireReminder(s: AppState, now = new Date()): Reminder & { days?: number } {
  const last = [...s.tireLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!last) return { level: "warning", title: "Tekanan ban", detail: "Belum pernah dicek" };
  const nextCheck = addDays(parseISO(last.date), s.settings.tireIntervalDays);
  const days = differenceInCalendarDays(nextCheck, now);
  const level: Level = days < 0 ? "overdue" : days <= 3 ? "warning" : "ok";
  const detail =
    days < 0 ? `Terlambat cek ${Math.abs(days)} hari` : `Cek lagi ${days} hari (${nextCheck.toISOString().slice(0, 10)})`;
  return { level, title: "Tekanan ban", detail, days };
}

export function allReminders(s: AppState, now = new Date()): Reminder[] {
  return [
    taxReminder("Pajak tahunan", s.taxes.annualDue, now),
    taxReminder("STNK 5 tahunan", s.taxes.stnkDue, now),
    serviceReminder(s, "oli", now),
    serviceReminder(s, "servis", now),
    tireReminder(s, now),
  ];
}
