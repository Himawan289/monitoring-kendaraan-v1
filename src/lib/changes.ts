import { fmtKm } from "./notify";
import type { Root, Vehicle } from "./types";

const SETTING_LABELS: Record<keyof Vehicle["settings"], string> = {
  oilIntervalKm: "Interval ganti oli (km)",
  oilIntervalMonths: "Interval ganti oli (bulan)",
  serviceIntervalKm: "Interval servis (km)",
  serviceIntervalMonths: "Interval servis (bulan)",
  tireIntervalDays: "Interval cek ban (hari)",
};

const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const typeLabel = (t: string) => (t === "mobil" ? "mobil" : "motor");

function byId<T extends { id: string }>(list: T[]) {
  return new Map(list.map((x) => [x.id, x]));
}

/** Pisahkan item baru dan item terhapus berdasarkan id. */
function listDiff<T extends { id: string }>(a: T[], b: T[]) {
  const am = byId(a);
  const bm = byId(b);
  return { added: b.filter((x) => !am.has(x.id)), removed: a.filter((x) => !bm.has(x.id)) };
}

function vehicleChanges(a: Vehicle, b: Vehicle): string[] {
  const out: string[] = [];
  if (a.vehicle.name !== b.vehicle.name) out.push(`✏️ Nama kendaraan: ${a.vehicle.name} → ${b.vehicle.name}`);
  if (a.vehicle.plate !== b.vehicle.plate) out.push(`✏️ Plat nomor: ${a.vehicle.plate || "-"} → ${b.vehicle.plate || "-"}`);
  if (a.vehicle.type !== b.vehicle.type) out.push(`✏️ Jenis kendaraan: ${typeLabel(a.vehicle.type)} → ${typeLabel(b.vehicle.type)}`);

  for (const k of Object.keys(SETTING_LABELS) as (keyof Vehicle["settings"])[]) {
    if (a.settings[k] !== b.settings[k]) out.push(`⚙️ ${SETTING_LABELS[k]}: ${a.settings[k]} → ${b.settings[k]}`);
  }
  if (a.taxes.annualDue !== b.taxes.annualDue) out.push(`📅 Jatuh tempo pajak tahunan: ${a.taxes.annualDue || "-"} → ${b.taxes.annualDue || "-"}`);
  if (a.taxes.stnkDue !== b.taxes.stnkDue) out.push(`📅 Jatuh tempo STNK 5 tahunan: ${a.taxes.stnkDue || "-"} → ${b.taxes.stnkDue || "-"}`);

  const odo = listDiff(a.odometerLogs, b.odometerLogs);
  odo.added.forEach((l) => out.push(`✅ Odometer dicatat: ${fmtKm(l.km)} (${l.date})`));
  odo.removed.forEach((l) => out.push(`🗑️ Odometer dihapus: ${fmtKm(l.km)} (${l.date})`));

  const svc = listDiff(a.serviceLogs, b.serviceLogs);
  const svcLabel = (t: string) => (t === "oli" ? "Ganti oli" : "Servis berkala");
  svc.added.forEach((l) =>
    out.push(`✅ ${svcLabel(l.type)} dicatat: ${fmtKm(l.km)} (${l.date})${l.workshop ? `, ${l.workshop}` : ""}${l.cost ? `, ${rp(l.cost)}` : ""}`),
  );
  svc.removed.forEach((l) => out.push(`🗑️ ${svcLabel(l.type)} dihapus: ${fmtKm(l.km)} (${l.date})`));

  const tire = listDiff(a.tireLogs, b.tireLogs);
  tire.added.forEach((l) => out.push(`✅ Tekanan ban dicatat (${l.date}): depan ${l.front ?? "-"} / belakang ${l.rear ?? "-"} PSI`));
  tire.removed.forEach((l) => out.push(`🗑️ Log ban dihapus (${l.date})`));

  return out.map((line) => `[${b.vehicle.name}] ${line}`);
}

/** Daftar perubahan antar dua kondisi data; kosong bila tidak ada yang berubah. */
export function describeChanges(a: Root, b: Root): string[] {
  const out: string[] = [];
  const { added, removed } = listDiff(a.vehicles, b.vehicles);
  added.forEach((v) => out.push(`🚗 Kendaraan ditambahkan: ${v.vehicle.name} (${typeLabel(v.vehicle.type)})`));
  removed.forEach((v) => out.push(`🗑️ Kendaraan dihapus: ${v.vehicle.name}`));
  const am = byId(a.vehicles);
  for (const v of b.vehicles) {
    const prev = am.get(v.id);
    if (prev) out.push(...vehicleChanges(prev, v));
  }
  return out;
}
