"use client";
import { clsx } from "clsx";
import type { VehicleType } from "@/lib/types";

export function TypePicker({ value, onChange }: { value: VehicleType; onChange: (t: VehicleType) => void }) {
  return (
    <div className="flex shrink-0 rounded-full border border-line bg-base p-1">
      {(["motor", "mobil"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={clsx("rounded-full px-4 py-1.5 text-sm font-medium transition", value === t ? "bg-gold text-on-gold" : "text-muted hover:text-fg")}
        >
          {t === "motor" ? "Motor" : "Mobil"}
        </button>
      ))}
    </div>
  );
}
