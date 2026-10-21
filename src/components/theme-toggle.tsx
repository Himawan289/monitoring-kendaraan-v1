"use client";
import { Moon, Sun } from "lucide-react";
import { clsx } from "clsx";
import { setTheme } from "@/lib/theme";

/** Tombol cepat terang/gelap; pilihan "Otomatis" ada di Pengaturan. */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const el = document.documentElement;
    const dark = el.dataset.theme ? el.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(dark ? "light" : "dark");
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti tema terang/gelap"
      title="Ganti tema"
      className={clsx("flex shrink-0 items-center justify-center rounded-full border border-line bg-card text-gold-ink transition hover:bg-fg/5", className)}
    >
      <Sun className="theme-sun size-5" />
      <Moon className="theme-moon size-5" />
    </button>
  );
}
