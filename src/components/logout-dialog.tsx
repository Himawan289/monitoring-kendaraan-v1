"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, LogOut } from "lucide-react";
import { btnCls, btnGhostCls } from "@/components/ui";
import { usePresence } from "@/lib/presence";
import { supabaseBrowser } from "@/lib/supabase/client";

const FAREWELL_MS = 1400;

function Farewell() {
  return (
    <div className="anim-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-base/95 backdrop-blur-md">
      <div className="anim-pop flex size-20 items-center justify-center rounded-full border border-line bg-card text-gold-ink">
        <LogOut className="size-9" />
      </div>
      <div className="anim-fade-up text-center" style={{ animationDelay: "0.2s" }}>
        <p className="text-xl font-semibold tracking-tight">Sampai jumpa</p>
        <p className="mt-1 text-sm text-muted">Mengamankan sesi Anda…</p>
      </div>
      <div className="relative h-8 w-48 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-px bg-line" />
        <Car className="anim-drive absolute left-1/2 top-0 size-6 -translate-x-1/2 text-gold-ink" />
      </div>
    </div>
  );
}

/** Konfirmasi keluar lalu animasi perpisahan sebelum kembali ke halaman masuk. */
export function LogoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const { mounted, state } = usePresence(open);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || leaving) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, leaving, onClose]);

  async function confirmOut() {
    setLeaving(true);
    await Promise.all([supabaseBrowser().auth.signOut(), new Promise((r) => setTimeout(r, FAREWELL_MS))]);
    router.replace("/login");
    router.refresh();
  }

  if (leaving) return <Farewell />;
  if (!mounted) return null;
  return (
    <div data-state={state} className="anim-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        data-state={state}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        className="anim-modal w-full max-w-sm rounded-3xl border border-line bg-card p-6 text-center shadow-2xl shadow-shade"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-bad/10 text-bad">
          <LogOut className="size-6" />
        </div>
        <h2 id="logout-title" className="text-lg font-semibold tracking-tight">Yakin ingin keluar?</h2>
        <p className="mt-1 text-sm text-muted">Anda perlu masuk lagi untuk melihat data kendaraan.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button ref={cancelRef} type="button" className={btnGhostCls} onClick={onClose}>Batal</button>
          <button type="button" className={btnCls} onClick={confirmOut}>Ya, keluar</button>
        </div>
      </div>
    </div>
  );
}
