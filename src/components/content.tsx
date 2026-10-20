"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { StoreGate } from "./store-gate";
import { VehicleSwitcher } from "./vehicle-switcher";

/** Dashboard lebar (grid), halaman form lebih sempit; keduanya terpusat. */
export function Content({ children }: { children: ReactNode }) {
  const path = usePathname();
  const wide = path === "/";
  if (path === "/login") return <>{children}</>;
  return (
    <main className="px-4 pb-28 pt-6 sm:px-6 md:ml-56 md:px-10 md:pb-10">
      <div className={clsx("mx-auto w-full", wide ? "max-w-5xl" : "max-w-3xl")}>
        <StoreGate>
          <VehicleSwitcher className="mb-5 md:hidden" />
          {children}
        </StoreGate>
      </div>
    </main>
  );
}
