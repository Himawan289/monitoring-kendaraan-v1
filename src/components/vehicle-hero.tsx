"use client";
import dynamic from "next/dynamic";
import { Hand } from "lucide-react";

const Vehicle3D = dynamic(() => import("./vehicle-3d"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-white/[0.03]" />,
});

export function VehicleHero({ name, plate, kind }: { name: string; plate: string; kind: "motor" | "mobil" }) {
  return (
    <div className="relative mb-5 h-72 overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-white/[0.05] to-card sm:h-96">
      <div className="absolute inset-0">
        <Vehicle3D kind={kind} />
      </div>
      <div className="pointer-events-none absolute left-5 top-5 sm:left-7 sm:top-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">{name}</h1>
        <p className="text-sm text-muted">{plate || "Ringkasan status kendaraan"}</p>
      </div>
      <p className="pointer-events-none absolute bottom-4 right-5 flex items-center gap-1.5 text-xs text-muted">
        <Hand className="size-3.5" /> Geser untuk memutar
      </p>
    </div>
  );
}
