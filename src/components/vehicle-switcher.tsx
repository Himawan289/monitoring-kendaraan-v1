"use client";
import { useEffect, useRef, useState } from "react";
import { Bike, Car, Check, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { useVehicles } from "@/lib/store";

export function VehicleSwitcher({ className }: { className?: string }) {
  const { vehicles, activeId, setActive } = useVehicles();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = vehicles.find((v) => v.id === activeId) ?? vehicles[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={clsx("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex w-full items-center gap-3 rounded-full border bg-card px-4 py-2.5 text-left transition",
          open ? "border-gold/60" : "border-line hover:border-gold/40",
        )}
      >
        {active.vehicle.type === "mobil" ? <Car className="size-4 shrink-0 text-gold" /> : <Bike className="size-4 shrink-0 text-gold" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{active.vehicle.name}</span>
          {active.vehicle.plate && <span className="block truncate text-[11px] text-muted">{active.vehicle.plate}</span>}
        </span>
        <ChevronDown className={clsx("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-2xl border border-line bg-card/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          {(["motor", "mobil"] as const).map((t) => {
            const group = vehicles.filter((v) => v.vehicle.type === t);
            if (group.length === 0) return null;
            const Icon = t === "mobil" ? Car : Bike;
            return (
              <li key={t} role="presentation">
                <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                  <Icon className="size-3.5" /> {t === "mobil" ? "Mobil" : "Motor"}
                </p>
                <ul role="group">
                  {group.map((v) => {
                    const selected = v.id === activeId;
                    return (
                      <li key={v.id} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          onClick={() => {
                            setActive(v.id);
                            setOpen(false);
                          }}
                          className={clsx(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                            selected ? "bg-gold/10 text-gold" : "text-fg/90 hover:bg-white/5",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{v.vehicle.name}</span>
                            {v.vehicle.plate && <span className="block truncate text-[11px] text-muted">{v.vehicle.plate}</span>}
                          </span>
                          {selected && <Check className="size-4 shrink-0" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
