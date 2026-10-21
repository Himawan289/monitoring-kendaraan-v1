import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-init";

export type Theme = "system" | "light" | "dark";

export const THEMES: { value: Theme; label: string }[] = [
  { value: "system", label: "Otomatis" },
  { value: "light", label: "Terang" },
  { value: "dark", label: "Gelap" },
];

const KEY = THEME_KEY;
const EVENT = "theme-change";

function read(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

export function setTheme(t: Theme) {
  try {
    if (t === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {
    // penyimpanan diblokir: tema hanya berlaku untuk sesi ini
  }
  if (t === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "system");
}
