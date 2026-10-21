"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, CircleGauge, Cog, FileText, Fuel, LayoutDashboard, Wrench } from "lucide-react";
import { clsx } from "clsx";
import { VehicleSwitcher } from "./vehicle-switcher";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/odometer", label: "Odometer", icon: Camera },
  { href: "/servis", label: "Servis", icon: Wrench },
  { href: "/bbm", label: "BBM", icon: Fuel },
  { href: "/komponen", label: "Suku cadang", icon: Cog },
  { href: "/pajak", label: "Pajak", icon: FileText },
  { href: "/ban", label: "Ban", icon: CircleGauge },
];

export function Nav() {
  const path = usePathname();
  if (path === "/login") return null;
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-card/60 p-5 backdrop-blur md:flex">
        <div className="mb-6 px-2 text-lg font-semibold leading-tight tracking-tight">
          Monitoring <span className="text-gold-ink">Kendaraan</span>
        </div>
        <VehicleSwitcher className="mb-5" />
        <nav className="flex flex-col gap-1.5">
          {ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition",
                path === href ? "bg-gold text-on-gold" : "text-muted hover:bg-fg/5 hover:text-fg",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <nav className="fixed inset-x-4 bottom-4 z-10 mx-auto flex max-w-md justify-between rounded-full border border-line bg-card/85 p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-2xl shadow-shade backdrop-blur-xl md:hidden">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={clsx(
              "flex size-10 items-center justify-center rounded-full transition",
              path === href ? "bg-gold text-on-gold" : "text-muted hover:text-fg",
            )}
          >
            <Icon className="size-5" />
          </Link>
        ))}
      </nav>
    </>
  );
}
