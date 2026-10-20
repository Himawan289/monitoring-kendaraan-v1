import type { AppState, Root } from "./types";

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
  fuelLogs: [],
  parts: [],
};

export const DEFAULT_ROOT: Root = { vehicles: [{ id: "default", ...DEFAULT_STATE }], activeId: "default" };
