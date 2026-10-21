"use client";
import Link from "next/link";
import { CircleGauge, FileText, Fuel, Gauge, Wrench } from "lucide-react";
import { clsx } from "clsx";
import { Card, LEVEL_STYLE, StatusBadge } from "@/components/ui";
import { VehicleHero } from "@/components/vehicle-hero";
import { Plus } from "lucide-react";
import { allReminders, currentOdometer, serviceReminder, taxReminder, tireReminder } from "@/lib/reminders";
import { fuelStats } from "@/lib/fuel";
import { useProfile } from "@/lib/profile";
import { useAppState, useVehicles } from "@/lib/store";
import type { Level } from "@/lib/types";

const rank: Record<Level, number> = { overdue: 0, warning: 1, ok: 2 };

function Tile({ href, icon: Icon, title, level, detail }: { href: string; icon: typeof Gauge; title: string; level: Level; detail: string }) {
  return (
    <Link href={href}>
      <Card className={clsx("h-full border-l-4 transition hover:shadow-md", level === "ok" ? "border-l-emerald-500" : level === "warning" ? "border-l-amber-500" : "border-l-red-500")}>
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-muted">
            <Icon className="size-4" /> {title}
          </span>
          <StatusBadge level={level} />
        </div>
        <p className="text-sm text-fg">{detail}</p>
      </Card>
    </Link>
  );
}

function FleetOverview() {
  const { vehicles } = useVehicles();
  const profile = useProfile();
  return (
    <section className="mb-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Halo{profile.name ? `, ${profile.name}` : ""} 👋</h1>
          <p className="text-sm text-muted">Pantau {vehicles.length} kendaraan Anda</p>
        </div>
        <Link href="/pengaturan" aria-label="Tambah kendaraan" className="flex size-11 items-center justify-center rounded-full border border-line bg-card text-gold-ink hover:bg-fg/5">
          <Plus className="size-5" />
        </Link>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { state } = useAppState();
  const odo = currentOdometer(state);
  const oil = serviceReminder(state, "oli");
  const svc = serviceReminder(state, "servis");
  const annual = taxReminder("Pajak tahunan", state.taxes.annualDue);
  const stnk = taxReminder("STNK 5 tahunan", state.taxes.stnkDue);
  const tire = tireReminder(state);
  const alerts = allReminders(state).filter((r) => r.level !== "ok").sort((a, b) => rank[a.level] - rank[b.level]);
  const fuel = fuelStats(state.fuelLogs);
  const lastTire = [...state.tireLogs].sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <>
      <FleetOverview />
      <VehicleHero key={state.id} name={state.vehicle.name} plate={state.vehicle.plate} kind={state.vehicle.type} />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
      <Card className="bg-gradient-to-br from-gold to-gold-end text-on-gold lg:col-span-1">
        <p className="flex items-center gap-2 text-sm text-on-gold/70"><Gauge className="size-4" /> Odometer</p>
        <p className="mt-1 text-4xl font-semibold tabular-nums">{odo.toLocaleString("id-ID")} <span className="text-lg font-normal text-on-gold/60">km</span></p>
        <Link href="/odometer" className="mt-3 inline-block rounded-full bg-on-gold px-4 py-2 text-sm font-medium text-gold hover:opacity-85">Update odometer</Link>
      </Card>

      {alerts.length > 0 ? (
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-fg">Perlu perhatian</h2>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.title} className="flex items-start gap-3 text-sm">
                <span className={clsx("mt-1.5 size-2 shrink-0 rounded-full", LEVEL_STYLE[a.level].dot)} />
                <span><b className="font-medium">{a.title}</b> — <span className="text-muted">{a.detail}</span></span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="flex items-center justify-center text-sm text-muted lg:col-span-2">Semua pengingat kendaraan ini aman.</Card>
      )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile href="/servis" icon={Wrench} title="Ganti oli" level={oil.level} detail={oil.detail} />
        <Tile href="/servis" icon={Wrench} title="Servis berkala" level={svc.level} detail={svc.detail} />
        <Tile href="/pajak" icon={FileText} title="Pajak tahunan" level={annual.level} detail={annual.detail} />
        <Tile href="/pajak" icon={FileText} title="STNK 5 tahunan" level={stnk.level} detail={stnk.detail} />
        <Tile
          href="/ban"
          icon={CircleGauge}
          title="Tekanan ban"
          level={tire.level}
          detail={lastTire ? `${tire.detail} · terakhir F ${lastTire.front ?? "-"} / R ${lastTire.rear ?? "-"} PSI` : tire.detail}
        />
        <Tile
          href="/bbm"
          icon={Fuel}
          title="Konsumsi BBM"
          level="ok"
          detail={fuel.avgKmPerL ? `${fuel.avgKmPerL.toFixed(1)} km/L · Rp ${Math.round(fuel.costPerKm ?? 0).toLocaleString("id-ID")}/km` : "Belum cukup data"}
        />
      </div>
    </>
  );
}
