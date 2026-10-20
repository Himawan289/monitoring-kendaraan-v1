import { DEFAULT_STATE } from "./defaults";
import type { AppState, Root, VehicleType } from "./types";

/** Data lama/parsial dilengkapi dengan nilai bawaan. */
export function normalize(r: Root): Root {
  return {
    ...r,
    vehicles: r.vehicles.map((v) => ({ ...DEFAULT_STATE, ...v, vehicle: { ...DEFAULT_STATE.vehicle, ...v.vehicle } })),
  };
}

export function updateVehicleInRoot(r: Root, id: string, fn: (s: AppState) => AppState): Root {
  return { ...r, vehicles: r.vehicles.map((v) => (v.id === id ? { ...fn(v), id } : v)) };
}

export function addVehicleToRoot(r: Root, id: string, name: string, type: VehicleType, plate = ""): Root {
  return {
    vehicles: [...r.vehicles, { id, ...DEFAULT_STATE, vehicle: { name: name || "Kendaraan baru", plate, type } }],
    activeId: id,
  };
}

/** null bila kendaraan tidak ada atau tinggal satu. */
export function removeVehicleFromRoot(r: Root, id: string): Root | null {
  if (r.vehicles.length <= 1 || !r.vehicles.some((v) => v.id === id)) return null;
  const vehicles = r.vehicles.filter((v) => v.id !== id);
  return { vehicles, activeId: r.activeId === id ? vehicles[0].id : r.activeId };
}

export function photoIds(r: Root): Set<string> {
  return new Set(r.vehicles.flatMap((v) => v.serviceLogs.flatMap((l) => [...(l.receiptPhotos ?? []), ...(l.afterPhotos ?? [])])));
}
