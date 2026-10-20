import type { ReactNode } from "react";
import { clsx } from "clsx";
import type { Level } from "@/lib/types";

export const LEVEL_STYLE: Record<Level, { badge: string; dot: string; label: string }> = {
  ok: { badge: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30", dot: "bg-emerald-500/100", label: "Aman" },
  warning: { badge: "bg-amber-500/10 text-amber-400 ring-amber-500/30", dot: "bg-amber-500/100", label: "Segera" },
  overdue: { badge: "bg-red-500/10 text-red-400 ring-red-500/30", dot: "bg-red-500/100", label: "Terlambat" },
};

export function StatusBadge({ level }: { level: Level }) {
  const s = LEVEL_STYLE[level];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1", s.badge)}>
      <span className={clsx("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={clsx("rounded-3xl border border-line bg-card p-4 sm:p-5", className)}>{children}</section>;
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </header>
  );
}

export const inputCls =
  "w-full rounded-2xl border border-line bg-base px-4 py-2.5 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30";
export const btnCls =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50";
export const btnGhostCls =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-medium text-fg/90 transition hover:bg-card/5";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">{children}</p>;
}
