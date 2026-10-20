import type { FuelLog } from "./types";

export interface FuelStats {
  avgKmPerL: number | null;
  costPerKm: number | null;
  totalCost: number;
  totalLiters: number;
  kmPerL: Map<string, number>; // per pengisian
}

/** Konsumsi dihitung dari jarak antar-pengisian penuh dibagi liter pengisian terbaru. */
export function fuelStats(logs: FuelLog[]): FuelStats {
  const sorted = [...logs].sort((a, b) => a.km - b.km || a.date.localeCompare(b.date));
  const kmPerL = new Map<string, number>();
  let dist = 0;
  let liters = 0;
  let cost = 0;
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const d = cur.km - sorted[i - 1].km;
    if (!cur.full || d <= 0 || cur.liters <= 0) continue;
    kmPerL.set(cur.id, d / cur.liters);
    dist += d;
    liters += cur.liters;
    cost += cur.cost;
  }
  return {
    avgKmPerL: liters > 0 ? dist / liters : null,
    costPerKm: dist > 0 ? cost / dist : null,
    totalCost: logs.reduce((n, l) => n + l.cost, 0),
    totalLiters: logs.reduce((n, l) => n + l.liters, 0),
    kmPerL,
  };
}
