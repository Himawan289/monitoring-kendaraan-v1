import type { VehicleType } from "./types";

export interface PartPreset {
  name: string;
  intervalKm?: number;
  intervalMonths?: number;
}

export const PART_PRESETS: Record<VehicleType, PartPreset[]> = {
  motor: [
    { name: "Ban depan", intervalKm: 20000, intervalMonths: 36 },
    { name: "Ban belakang", intervalKm: 15000, intervalMonths: 36 },
    { name: "Aki", intervalMonths: 24 },
    { name: "Kampas rem depan", intervalKm: 15000 },
    { name: "Kampas rem belakang", intervalKm: 15000 },
    { name: "Filter udara", intervalKm: 12000, intervalMonths: 12 },
    { name: "V-belt / CVT", intervalKm: 24000 },
    { name: "Busi", intervalKm: 8000 },
    { name: "Oli gardan", intervalKm: 8000, intervalMonths: 12 },
  ],
  mobil: [
    { name: "Ban", intervalKm: 40000, intervalMonths: 48 },
    { name: "Aki", intervalMonths: 24 },
    { name: "Kampas rem", intervalKm: 30000 },
    { name: "Filter udara", intervalKm: 20000, intervalMonths: 12 },
    { name: "Busi", intervalKm: 40000 },
    { name: "Minyak rem", intervalMonths: 24 },
    { name: "Air radiator", intervalKm: 40000, intervalMonths: 24 },
    { name: "Oli transmisi", intervalKm: 40000 },
  ],
};
