"use client";
import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { usePresence } from "@/lib/presence";

const SHOW_MS = 3500;

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function labelOf(el: Control): string {
  const text = el.closest("label")?.querySelector("span")?.textContent?.trim() || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.name || "Kolom ini";
  return text.replace(/\s*\(.*\)\s*$/, "").replace(/^mis\.\s*/i, "");
}

function messageFor(el: Control): string {
  const label = labelOf(el);
  const v = el.validity;
  if (v.valueMissing) return `${label} wajib diisi`;
  if (v.typeMismatch) return el.getAttribute("type") === "email" ? "Format email tidak valid" : `Format ${label.toLowerCase()} tidak valid`;
  if (v.tooShort) return `${label} minimal ${(el as HTMLInputElement).minLength} karakter`;
  if (v.tooLong) return `${label} maksimal ${(el as HTMLInputElement).maxLength} karakter`;
  if (v.rangeUnderflow) return `${label} minimal ${(el as HTMLInputElement).min}`;
  if (v.rangeOverflow) return `${label} maksimal ${(el as HTMLInputElement).max}`;
  if (v.patternMismatch || v.badInput || v.stepMismatch) return `${label} tidak valid`;
  return el.validationMessage;
}

/** Ganti gelembung validasi bawaan browser dengan notifikasi pop up berbahasa Indonesia. */
export function ValidationToast() {
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handled = useRef(false);
  const toast = usePresence(visible, 160);

  useEffect(() => {
    const onInvalid = (e: Event) => {
      e.preventDefault(); // sembunyikan gelembung bawaan
      const el = e.target as Control;
      el.dataset.invalid = "true";
      if (handled.current) return; // satu notifikasi per kirim; kolom pertama yang difokuskan
      handled.current = true;
      queueMicrotask(() => (handled.current = false));
      el.focus();
      setText(messageFor(el));
      setVisible(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), SHOW_MS);
    };
    const clear = (e: Event) => {
      const el = e.target as HTMLElement;
      if (el.dataset?.invalid) delete el.dataset.invalid;
    };
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", clear, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", clear, true);
      clearTimeout(timer.current);
    };
  }, []);

  if (!toast.mounted) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <div
        role="alert"
        data-state={toast.state}
        className="anim-menu pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border border-bad/30 bg-card px-4 py-3 text-sm shadow-2xl shadow-shade"
      >
        <AlertCircle className="size-5 shrink-0 text-bad" />
        <span>{text}</span>
      </div>
    </div>
  );
}
