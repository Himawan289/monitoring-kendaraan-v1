import type { AppState, Root, VehicleType } from "./types";

/** Servis berkala rutin: motor tiap 3 bulan, mobil tiap 6 bulan. */
export const serviceMonthsFor = (type: VehicleType) => (type === "mobil" ? 6 : 3);

export const DEFAULT_STATE: AppState = {
  vehicle: { name: "Kendaraan Saya", plate: "", type: "motor" },
  settings: {
    oilIntervalKm: 2000,
    oilIntervalMonths: 6,
    serviceIntervalKm: 10000,
    serviceIntervalMonths: serviceMonthsFor("motor"),
    tireIntervalDays: 14,
  },
  taxes: { annualDue: "", stnkDue: "" },
  odometerLogs: [],
  serviceLogs: [],
  tireLogs: [],
  fuelLogs: [],
  parts: [],
};

export const DEFAULT_ROOT: Root = { vehicles: [{ id: "default", ...DEFAULT_STATE }], activeId: "default" };
