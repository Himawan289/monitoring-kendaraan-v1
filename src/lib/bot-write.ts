import { currentOdometer } from "./reminders";
import type { AppState, Root, Vehicle, VehicleType } from "./types";

export type WriteCmd =
  | { kind: "odo"; km: number }
  | { kind: "service"; type: "oli" | "servis"; km: number; cost: number; workshop: string }
  | { kind: "bbm"; liters: number; cost: number; km?: number }
  | { kind: "ban"; front?: number; rear?: number }
  | { kind: "fix_odo"; km: number }
  | { kind: "add_vehicle"; type: VehicleType; name: string; plate: string }
  | { kind: "set_plate"; plate: string }
  | { kind: "rename"; name: string }
  | { kind: "set_type"; type: VehicleType }
  | { kind: "delete_vehicle" };

export const WRITE_HELP = [
  "Mencatat data (tambahkan @namaKendaraan bila perlu):",
  "odo 22150",
  "oli 22150 80rb bengkel-x",
  "servis 22150 250rb bengkel-x",
  "bbm 3,2 25000 [km]  (liter, total harga)",
  "ban 30 32  (depan, belakang)",
  "",
  "Mengubah data:",
  "koreksi 21988  (betulkan odometer terakhir, boleh lebih kecil)",
  "tambah motor NMAX B1234XYZ  (atau: tambah mobil Brio)",
  "plat B1234XYZ @nmax",
  "nama Vario 160 @nmax",
  "jenis mobil @nmax",
  "hapus @nmax ya",
].join("\n");

const PLATE = /^[a-z]{1,2}\d{1,4}[a-z]{0,3}$/i;
const asType = (t?: string): VehicleType | null => (t === "motor" || t === "mobil" ? t : null);

/** "80rb", "80k", "1,5jt", "80.000", "3,2" → angka; NaN bila bukan angka. */
export function parseNum(tok: string): number {
  const m = tok.toLowerCase().match(/^(\d+(?:[.,]\d+)*)(rb|k|jt)?$/);
  if (!m) return NaN;
  let n = m[1];
  n = /^\d{1,3}(\.\d{3})+$/.test(n) ? n.replace(/\./g, "") : n.replace(",", ".");
  return Number(n) * (m[2] === "jt" ? 1_000_000 : m[2] ? 1000 : 1);
}

export type Parsed = { cmd: WriteCmd; vehicleQuery: string } | { error: string } | null;

/** null = bukan perintah tulis (biarkan jadi perintah baca). */
export function parseWrite(text: string): Parsed {
  const all = text.trim().split(/\s+/);
  const vq = all.find((t) => t.startsWith("@"));
  const tokens = all.filter((t) => t !== vq);
  const vehicleQuery = vq ? vq.slice(1).toLowerCase() : "";
  const name = tokens[0]?.toLowerCase().replace(/^\//, "").replace(/@\w+$/, "");
  const args = tokens.slice(1);

  switch (name) {
    case "odo": {
      const km = parseNum(args[0] ?? "");
      return Number.isFinite(km) && km > 0 ? { cmd: { kind: "odo", km }, vehicleQuery } : { error: "Format: odo 22150" };
    }
    case "oli":
    case "servis": {
      const km = parseNum(args[0] ?? "");
      if (!Number.isFinite(km) || km <= 0) return args.length ? { error: `Format: ${name} 22150 80rb bengkel-x` } : null;
      let rest = args.slice(1);
      const cost = rest.length && Number.isFinite(parseNum(rest[0])) ? parseNum(rest[0]) : 0;
      if (cost) rest = rest.slice(1);
      return { cmd: { kind: "service", type: name, km, cost, workshop: rest.join(" ") }, vehicleQuery };
    }
    case "bbm": {
      if (args.length === 0) return null;
      const [liters, cost, km] = [parseNum(args[0]), parseNum(args[1] ?? ""), args[2] ? parseNum(args[2]) : undefined];
      if (!(liters > 0) || !Number.isFinite(cost) || (km !== undefined && !Number.isFinite(km))) return { error: "Format: bbm 3,2 25000 [km]" };
      return { cmd: { kind: "bbm", liters, cost, km }, vehicleQuery };
    }
    case "ban": {
      if (args.length === 0) return null;
      const [front, rear] = [parseNum(args[0]), args[1] ? parseNum(args[1]) : undefined];
      if (!Number.isFinite(front) || (rear !== undefined && !Number.isFinite(rear))) return { error: "Format: ban 30 32" };
      return { cmd: { kind: "ban", front, rear }, vehicleQuery };
    }
    case "koreksi": {
      const km = parseNum(args[0] ?? "");
      return Number.isFinite(km) && km > 0 ? { cmd: { kind: "fix_odo", km }, vehicleQuery } : { error: "Format: koreksi 21988" };
    }
    case "tambah": {
      const type = asType(args[0]?.toLowerCase());
      let words = args.slice(1);
      if (!type || words.length === 0) return { error: "Format: tambah motor NMAX B1234XYZ (atau: tambah mobil Brio)" };
      let plate = "";
      if (words.length > 1 && PLATE.test(words[words.length - 1])) {
        plate = words[words.length - 1].toUpperCase();
        words = words.slice(0, -1);
      }
      return { cmd: { kind: "add_vehicle", type, name: words.join(" "), plate }, vehicleQuery };
    }
    case "plat":
      return args[0] && PLATE.test(args[0]) ? { cmd: { kind: "set_plate", plate: args[0].toUpperCase() }, vehicleQuery } : { error: "Format: plat B1234XYZ @nmax" };
    case "nama":
      return args.length ? { cmd: { kind: "rename", name: args.join(" ") }, vehicleQuery } : { error: "Format: nama Vario 160 @nmax" };
    case "jenis": {
      const type = asType(args[0]?.toLowerCase());
      return type ? { cmd: { kind: "set_type", type }, vehicleQuery } : { error: "Format: jenis mobil @nmax" };
    }
    case "hapus": {
      if (!vq) return { error: "Format: hapus @nmax ya (nama kendaraan wajib disebut)" };
      return args.some((t) => t.toLowerCase() === "ya")
        ? { cmd: { kind: "delete_vehicle" }, vehicleQuery }
        : { error: `Ini menghapus semua data kendaraan. Kirim: hapus ${vq} ya` };
    }
    default:
      return null;
  }
}

export function pickVehicle(root: Root, query: string): Vehicle | undefined {
  if (!query) return root.vehicles.find((v) => v.id === root.activeId) ?? root.vehicles[0];
  return root.vehicles.find((v) => v.vehicle.name.toLowerCase().replace(/\s+/g, "").includes(query));
}

/** Terapkan perintah; mengembalikan pesan error bila ditolak. */
export function applyWrite(
  cmd: WriteCmd,
  v: Vehicle,
  date: string,
  id: () => string,
): { error: string } | { next: (s: AppState) => AppState; note?: string } {
  const odo = currentOdometer(v);
  if (cmd.kind === "fix_odo") return fixOdometer(cmd.km, v, date, id);
  if (cmd.kind === "set_plate") return { next: (s) => ({ ...s, vehicle: { ...s.vehicle, plate: cmd.plate } }) };
  if (cmd.kind === "rename") return { next: (s) => ({ ...s, vehicle: { ...s.vehicle, name: cmd.name } }) };
  if (cmd.kind === "set_type") return { next: (s) => ({ ...s, vehicle: { ...s.vehicle, type: cmd.type } }) };
  if (cmd.kind === "add_vehicle" || cmd.kind === "delete_vehicle") return { error: "Perintah ini ditangani di tingkat akun." };
  const km = cmd.kind === "odo" || cmd.kind === "service" ? cmd.km : cmd.kind === "bbm" ? (cmd.km ?? odo) : 0;
  if (km && km < odo) return { error: `Ditolak: ${km.toLocaleString("id-ID")} km lebih kecil dari odometer terakhir (${odo.toLocaleString("id-ID")} km).` };

  switch (cmd.kind) {
    case "odo":
      return { next: (s) => ({ ...s, odometerLogs: [{ id: id(), date, km, source: "manual" }, ...s.odometerLogs] }) };
    case "service":
      return {
        next: (s) => ({
          ...s,
          serviceLogs: [{ id: id(), type: cmd.type, date, km, cost: cmd.cost, workshop: cmd.workshop, notes: "" }, ...s.serviceLogs],
        }),
      };
    case "bbm":
      return { next: (s) => ({ ...s, fuelLogs: [{ id: id(), date, km, liters: cmd.liters, cost: cmd.cost, full: true }, ...s.fuelLogs] }) };
    case "ban":
      return { next: (s) => ({ ...s, tireLogs: [{ id: id(), date, front: cmd.front, rear: cmd.rear, notes: "" }, ...s.tireLogs] }) };
  }
}

/** Betulkan odometer terakhir: ubah catatan ber-km tertinggi (atau buat baru), boleh turun. */
function fixOdometer(km: number, v: Vehicle, date: string, id: () => string): { next: (s: AppState) => AppState; note?: string } {
  const top = [...v.odometerLogs].sort((a, b) => b.km - a.km)[0];
  const next = (s: AppState): AppState =>
    top
      ? { ...s, odometerLogs: s.odometerLogs.map((l) => (l.id === top.id ? { ...l, km, source: "manual" } : l)) }
      : { ...s, odometerLogs: [{ id: id(), date, km, source: "manual" }, ...s.odometerLogs] };
  const after = currentOdometer(next(v));
  return after > km
    ? { next, note: `Odometer dikoreksi, tetapi catatan servis/BBM masih mencatat ${after.toLocaleString("id-ID")} km sehingga angka itu yang dipakai. Betulkan lewat website.` }
    : { next };
}
