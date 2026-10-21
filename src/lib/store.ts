"use client";
import { useCallback, useSyncExternalStore } from "react";
import { describeChanges } from "./changes";
import { DEFAULT_ROOT, DEFAULT_STATE } from "./defaults";
import { getFamilyId } from "./family";
import { notify } from "./notify";
import { deletePhotos } from "./photos";
import { addVehicleToRoot, normalize, photoIds, removeVehicleFromRoot, updateVehicleInRoot } from "./root-ops";
import { supabaseBrowser } from "./supabase/client";
import type { AppState, Root, Vehicle, VehicleType } from "./types";

export { DEFAULT_STATE };

type Status = "loading" | "ready" | "error";
type Mutation = (r: Root) => Root;

// serverRoot = kondisi terakhir yang diketahui di database; cache = serverRoot + perubahan lokal yang belum tersimpan.
let serverRoot: Root = DEFAULT_ROOT;
let version = 0;
const pending: Mutation[] = [];
let cache: Root = DEFAULT_ROOT;
let status: Status = "loading";
let familyId: string | null = null;
let flushing = false;
let started = false;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function recompute() {
  cache = pending.reduce((r, f) => f(r), serverRoot);
  emit();
}

function setServer(row: { data: unknown; version: number }) {
  serverRoot = normalize(row.data as Root);
  version = row.version;
}

async function fetchRow() {
  const { data } = await supabaseBrowser().from("app_state").select("data,version").eq("user_id", familyId!).maybeSingle();
  return data;
}

function readLegacyLocal(): Root | null {
  try {
    const v2 = localStorage.getItem("monitoring-kendaraan:v2");
    if (v2) return normalize(JSON.parse(v2) as Root);
    const v1 = localStorage.getItem("monitoring-kendaraan:v1");
    if (v1) {
      const id = crypto.randomUUID();
      return normalize({ vehicles: [{ id, ...DEFAULT_STATE, ...JSON.parse(v1) }], activeId: id });
    }
  } catch {}
  return null;
}

/** Muat data dari Supabase (dan impor data lama dari browser bila ini login pertama). */
export async function initStore() {
  if (started) return;
  started = true;
  try {
    const sb = supabaseBrowser();
    const { data } = await sb.auth.getUser();
    if (!data.user) throw new Error("belum login");
    familyId = await getFamilyId();

    let row = await fetchRow();
    if (!row) {
      // data bersama dibuat sekali oleh pemilik; pengguna lain menunggu sampai ada
      if (data.user.id !== familyId) throw new Error("data keluarga belum dibuat");
      const initial = readLegacyLocal() ?? DEFAULT_ROOT;
      await sb.from("app_state").insert({ user_id: familyId, data: initial, version: 0 });
      row = await fetchRow();
    }
    if (!row) throw new Error("gagal memuat");
    setServer(row);
    status = "ready";
    recompute();

    sb.channel("app_state")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_state", filter: `user_id=eq.${familyId}` }, (p: { new: unknown }) => {
        const next = p.new as { data: unknown; version: number };
        if (next.version > version && !flushing) {
          setServer(next);
          recompute();
        }
      })
      .subscribe();
    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState !== "visible" || pending.length) return;
      const fresh = await fetchRow();
      if (fresh && fresh.version > version) {
        setServer(fresh);
        recompute();
      }
    });
  } catch {
    status = "error";
    started = false;
    emit();
  }
}

async function flush() {
  if (flushing) return;
  flushing = true;
  try {
    while (pending.length) {
      const next = pending[0](serverRoot);
      const { data, error } = await supabaseBrowser()
        .from("app_state")
        .update({ data: next, version: version + 1, updated_at: new Date().toISOString() })
        .eq("user_id", familyId!)
        .eq("version", version)
        .select("version");
      if (error) {
        await new Promise((r) => setTimeout(r, 3000)); // offline: coba lagi
        continue;
      }
      if (data.length === 1) {
        serverRoot = next;
        version += 1;
        pending.shift();
      } else {
        const fresh = await fetchRow(); // ada tulisan lain (mis. dari Telegram): ambil terbaru lalu ulangi
        if (fresh) setServer(fresh);
      }
    }
  } finally {
    flushing = false;
    recompute();
  }
}

// Perubahan beruntun (mis. mengetik nama) digabung: kirim selisih awal→akhir setelah jeda.
const NOTIFY_DELAY_MS = 1500;
let baseline: Root | null = null;
let notifyTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleNotify(prev: Root) {
  baseline ??= prev;
  clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => {
    const lines = describeChanges(baseline!, cache);
    baseline = null;
    if (lines.length === 0) return;
    const text = lines.join("\n");
    notify(text.length > 3500 ? text.slice(0, 3490) + "…" : text);
  }, NOTIFY_DELAY_MS);
}

function commit(fn: Mutation) {
  if (status !== "ready") return;
  scheduleNotify(cache);
  pending.push(fn);
  recompute();
  void flush();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const read = () => cache;
export const getRoot = read;

function activeOf(r: Root): Vehicle {
  return r.vehicles.find((v) => v.id === r.activeId) ?? r.vehicles[0];
}

export function useStoreStatus(): Status {
  return useSyncExternalStore(subscribe, () => status, () => "loading" as Status);
}

/** Data kendaraan aktif; `update` hanya mengubah kendaraan aktif. */
export function useAppState() {
  const root = useSyncExternalStore(subscribe, read, () => DEFAULT_ROOT);
  const update = useCallback((fn: (s: AppState) => AppState) => {
    const id = activeOf(read()).id;
    commit((r) => updateVehicleInRoot(r, id, fn));
  }, []);
  return { state: activeOf(root), update };
}

export function updateVehicle(id: string, fn: (s: AppState) => AppState) {
  commit((r) => updateVehicleInRoot(r, id, fn));
}

/** Tambah kendaraan baru dan jadikan aktif; mengembalikan id-nya. */
export function addVehicle(name: string, type: VehicleType, plate = ""): string {
  const id = crypto.randomUUID();
  commit((r) => addVehicleToRoot(r, id, name, type, plate));
  return id;
}

/** Hapus kendaraan beserta fotonya; kendaraan terakhir tidak bisa dihapus. */
export function removeVehicle(id: string): boolean {
  const before = read();
  const after = removeVehicleFromRoot(before, id);
  if (!after) return false;
  const keep = photoIds(after);
  deletePhotos([...photoIds(before)].filter((p) => !keep.has(p)));
  commit((r) => removeVehicleFromRoot(r, id) ?? r);
  return true;
}

export function useVehicles() {
  const root = useSyncExternalStore(subscribe, read, () => DEFAULT_ROOT);
  const setActive = useCallback((id: string) => commit((r) => ({ ...r, activeId: id })), []);
  return { vehicles: root.vehicles, activeId: activeOf(root).id, setActive, add: addVehicle, remove: removeVehicle };
}

export const uid = () => crypto.randomUUID();
export const today = () => new Date().toISOString().slice(0, 10);
