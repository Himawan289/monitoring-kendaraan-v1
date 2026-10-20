"use client";
import { useEffect, type ReactNode } from "react";
import { initStore, useStoreStatus } from "@/lib/store";

/** Tahan tampilan sampai data dari Supabase siap. */
export function StoreGate({ children }: { children: ReactNode }) {
  const status = useStoreStatus();
  useEffect(() => {
    initStore();
  }, []);
  if (status === "ready") return <>{children}</>;
  if (status === "error") {
    return (
      <p className="mt-20 text-center text-sm text-muted">
        Gagal memuat data. <a className="text-gold underline" href="/login">Masuk ulang</a> atau muat ulang halaman.
      </p>
    );
  }
  return <p className="mt-20 animate-pulse text-center text-sm text-muted">Memuat data…</p>;
}
