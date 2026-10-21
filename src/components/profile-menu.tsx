"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "@/lib/profile";
import { LogoutDialog } from "./logout-dialog";

const ITEM = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg/90 transition hover:bg-fg/5";

/** Menu profil di navbar: pengaturan dan keluar. */
export function ProfileMenu({ className }: { className?: string }) {
  const { name, email } = useProfile();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className={clsx("relative", className)}>
      <button
        type="button"
        aria-label="Menu profil"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-full min-h-10 min-w-10 items-center justify-center rounded-full bg-gold text-sm font-semibold uppercase text-on-gold transition hover:brightness-110"
      >
        {(name || email)[0] ?? "?"}
      </button>
      {open && (
        <div className="anim-fade-in absolute right-0 top-full z-30 mt-2 w-60 rounded-2xl border border-line bg-card p-1.5 shadow-2xl shadow-shade">
          <div className="border-b border-line px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-medium">{name || email || "…"}</p>
            {name && <p className="truncate text-xs text-muted">{email}</p>}
          </div>
          <Link href="/pengaturan" onClick={() => setOpen(false)} className={clsx(ITEM, "mt-1.5")}>
            <Settings className="size-4" /> Pengaturan
          </Link>
          <button type="button" onClick={() => { setOpen(false); setConfirming(true); }} className={clsx(ITEM, "hover:text-bad")}>
            <LogOut className="size-4" /> Keluar
          </button>
        </div>
      )}
      <LogoutDialog open={confirming} onClose={() => setConfirming(false)} />
    </div>
  );
}
