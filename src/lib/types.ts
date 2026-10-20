export type VehicleType = "motor" | "mobil";

export type Level = "ok" | "warning" | "overdue";

export interface OdometerLog {
  id: string;
  date: string; // ISO
  km: number;
  photo?: string; // data URL thumbnail
  source: "ocr" | "manual";
}

export interface ServiceLog {
  id: string;
  date: string;
  km: number;
  type: "oli" | "servis";
  cost: number;
  workshop: string;
  notes: string;
  receiptPhotos?: string[]; // id foto di IndexedDB
  afterPhotos?: string[];
}

export interface FuelLog {
  id: string;
  date: string;
  km: number;
  liters: number;
  cost: number;
  full: boolean; // diisi penuh (dipakai untuk hitung km/L)
}

export interface Part {
  id: string;
  name: string;
  intervalKm?: number;
  intervalMonths?: number;
  lastKm: number;
  lastDate: string;
}

export interface TireLog {
  id: string;
  date: string;
  front?: number; // PSI
  rear?: number;
  notes: string;
}

export interface AppState {
  vehicle: { name: string; plate: string; type: VehicleType };
  settings: {
    oilIntervalKm: number;
    oilIntervalMonths: number;
    serviceIntervalKm: number;
    serviceIntervalMonths: number;
    tireIntervalDays: number;
  };
  taxes: { annualDue: string; stnkDue: string }; // YYYY-MM-DD or ""
  odometerLogs: OdometerLog[];
  serviceLogs: ServiceLog[];
  tireLogs: TireLog[];
  fuelLogs: FuelLog[];
  parts: Part[];
}

export type Vehicle = AppState & { id: string };

export interface Root {
  vehicles: Vehicle[];
  activeId: string;
}
