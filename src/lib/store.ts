"use client";
import { useCallback, useSyncExternalStore } from "react";
import type { AppState, Root, Vehicle, VehicleType } from "./types";

const KEY_V1 = "monitoring-kendaraan:v1";
const KEY = "monitoring-kendaraan:v2";

export const DEFAULT_STATE: AppState = {
  vehicle: { name: "Kendaraan Saya", plate: "", type: "motor" },
  settings: {
    oilIntervalKm: 2000,
    oilIntervalMonths: 6,
    serviceIntervalKm: 10000,
    serviceIntervalMonths: 12,
    tireIntervalDays: 14,
  },
  taxes: { annualDue: "", stnkDue: "" },
  odometerLogs: [],
  serviceLogs: [],
  tireLogs: [],
};

const DEFAULT_ROOT: Root = { vehicles: [{ id: "default", ...DEFAULT_STATE }], activeId: "default" };

const listeners = new Set<() => void>();
let cacheRaw: string | null = null;
let cacheVal: Root = DEFAULT_ROOT;

/** Data lama belum punya tipe kendaraan: anggap motor. */
function normalize(r: Root): Root {
  return { ...r, vehicles: r.vehicles.map((v) => ({ ...v, vehicle: { ...DEFAULT_STATE.vehicle, ...v.vehicle } })) };
}

function parse(raw: string | null, rawV1: string | null): Root {
  try {
    if (raw) {
      const r = JSON.parse(raw) as Root;
      if (r.vehicles?.length) return normalize(r);
    }
    if (rawV1) {
      // migrasi dari satu kendaraan (v1)
      const id = crypto.randomUUID();
      return normalize({ vehicles: [{ id, ...DEFAULT_STATE, ...JSON.parse(rawV1) }], activeId: id });
    }
  } catch {}
  return DEFAULT_ROOT;
}

function read(): Root {
  let raw: string | null = null;
  let rawV1: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
    rawV1 = raw ? null : localStorage.getItem(KEY_V1);
  } catch {}
  const sig = raw ?? (rawV1 ? "v1:" + rawV1 : null);
  if (sig === cacheRaw) return cacheVal;
  cacheRaw = sig;
  cacheVal = parse(raw, rawV1);
  return cacheVal;
}

function write(next: Root) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function activeOf(r: Root): Vehicle {
  return r.vehicles.find((v) => v.id === r.activeId) ?? r.vehicles[0];
}

/** Data kendaraan aktif; `update` hanya mengubah kendaraan aktif. */
export function useAppState() {
  const root = useSyncExternalStore(subscribe, read, () => DEFAULT_ROOT);
  const state = activeOf(root);
  const update = useCallback((fn: (s: AppState) => AppState) => {
    const r = read();
    const cur = activeOf(r);
    write({ ...r, vehicles: r.vehicles.map((v) => (v.id === cur.id ? { ...fn(cur), id: cur.id } : v)) });
  }, []);
  return { state, update };
}

export function useVehicles() {
  const root = useSyncExternalStore(subscribe, read, () => DEFAULT_ROOT);
  const activeId = activeOf(root).id;
  const setActive = useCallback((id: string) => write({ ...read(), activeId: id }), []);
  const add = useCallback((name: string, type: VehicleType) => {
    const id = crypto.randomUUID();
    const r = read();
    write({ vehicles: [...r.vehicles, { id, ...DEFAULT_STATE, vehicle: { name: name || "Kendaraan baru", plate: "", type } }], activeId: id });
  }, []);
  const remove = useCallback((id: string) => {
    const r = read();
    if (r.vehicles.length <= 1) return;
    const vehicles = r.vehicles.filter((v) => v.id !== id);
    write({ vehicles, activeId: r.activeId === id ? vehicles[0].id : r.activeId });
  }, []);
  return { vehicles: root.vehicles, activeId, setActive, add, remove };
}

export const uid = () => crypto.randomUUID();
export const today = () => new Date().toISOString().slice(0, 10);
