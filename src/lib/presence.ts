"use client";
import { useEffect, useState } from "react";

/** Tahan elemen tetap terpasang selama animasi keluar; state dipakai sebagai data-state. */
export function usePresence(open: boolean, ms = 180): { mounted: boolean; state: "open" | "closed" } {
  const [shown, setShown] = useState(open);
  if (open && !shown) setShown(true);
  useEffect(() => {
    if (open || !shown) return;
    const t = setTimeout(() => setShown(false), ms);
    return () => clearTimeout(t);
  }, [open, shown, ms]);
  return { mounted: open || shown, state: open ? "open" : "closed" };
}
