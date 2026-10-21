"use client";
import { useEffect, useRef, useState } from "react";
import { onToast } from "@/lib/toast";
import { usePresence } from "@/lib/presence";

const SHOW_MS = 2600;

/** Notifikasi sukses dengan centang yang tergambar. */
export function Toaster() {
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { mounted, state } = usePresence(visible, 180);

  useEffect(() => {
    const off = onToast((t) => {
      setToast(t);
      setVisible(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), SHOW_MS);
    });
    return () => {
      off();
      clearTimeout(timer.current);
    };
  }, []);

  if (!mounted || !toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
      <div
        key={toast.id}
        role="status"
        data-state={state}
        className="anim-menu pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border border-ok/30 bg-card px-4 py-3 text-sm shadow-2xl shadow-shade"
      >
        <svg viewBox="0 0 32 32" className="size-7 shrink-0 text-ok" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle className="anim-draw" cx="16" cy="16" r="13" pathLength="1" />
          <path className="anim-draw" style={{ animationDelay: "0.35s" }} d="M10 16.5l4 4 8-9" pathLength="1" />
        </svg>
        <span className="font-medium">{toast.text}</span>
      </div>
    </div>
  );
}
