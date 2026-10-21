"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { StoreGate } from "./store-gate";
import { VehicleSwitcher } from "./vehicle-switcher";
import { ThemeToggle } from "./theme-toggle";

/** Dashboard lebar (grid), halaman form lebih sempit; keduanya terpusat. */
export function Content({ children }: { children: ReactNode }) {
  const path = usePathname();
  const wide = path === "/";
  if (path === "/login") {
    return (
      <>
        <ThemeToggle className="fixed right-4 top-4 z-10" />
        {children}
      </>
    );
  }
  return (
    <>
      <ThemeToggle className="fixed right-3 top-3 z-20 hidden size-10 md:flex" />
      <main className="px-4 pb-28 pt-6 sm:px-6 md:ml-56 md:pl-10 md:pr-16 md:pb-10">
        <div className={clsx("mx-auto w-full", wide ? "max-w-5xl" : "max-w-3xl")}>
          <StoreGate>
            <div className="mb-5 flex items-center gap-3 md:hidden">
              <VehicleSwitcher className="min-w-0 flex-1" />
              <ThemeToggle />
            </div>
            {children}
          </StoreGate>
        </div>
      </main>
    </>
  );
}
