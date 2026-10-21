"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ClipboardCheck, Pencil, Trash2 } from "lucide-react";
import { btnCls, btnGhostCls, inputCls } from "@/components/ui";
import { usePresence } from "@/lib/presence";

export type ConfirmRow = [label: string, value: string];

export interface ConfirmConfig {
  title?: string;
  message?: string;
  rows?: ConfirmRow[];
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  run: () => void;
}

type State = "open" | "closed";

const DANGER_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full bg-bad px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50";

/** Esc di fase tangkap: hanya menutup pop up teratas, bukan dialog di bawahnya. */
function useEscape(onCancel: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onCancel();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel]);
}

function Shell({ state, onCancel, labelId, children, role = "alertdialog" }: { state: State; onCancel: () => void; labelId: string; children: ReactNode; role?: "alertdialog" | "dialog" }) {
  useEscape(onCancel);
  return (
    <div data-state={state} className="anim-backdrop fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { e.stopPropagation(); onCancel(); }}>
      <div
        data-state={state}
        role={role}
        aria-modal="true"
        aria-labelledby={labelId}
        className="anim-modal w-full max-w-sm rounded-3xl border border-line bg-card p-6 shadow-2xl shadow-shade"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Confirm({ cfg, state, onConfirm, onCancel }: { cfg: ConfirmConfig; state: State; onConfirm: () => void; onCancel: () => void }) {
  const danger = cfg.tone === "danger";
  const Icon = danger ? Trash2 : ClipboardCheck;
  return (
    <Shell state={state} onCancel={onCancel} labelId="confirm-title">
      <div className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${danger ? "bg-bad/10 text-bad" : "bg-gold/15 text-gold-ink"}`}>
        <Icon className="size-6" />
      </div>
      <h2 id="confirm-title" className="text-center text-lg font-semibold tracking-tight">{cfg.title ?? "Apakah data sudah benar?"}</h2>
      <p className="mt-1 text-center text-sm text-muted">{cfg.message ?? "Periksa kembali sebelum menyimpan."}</p>
      {cfg.rows && cfg.rows.length > 0 && (
        <dl className="mt-4 divide-y divide-line rounded-2xl border border-line bg-base px-4 text-sm">
          {cfg.rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-muted">{label}</dt>
              <dd className="min-w-0 truncate text-right font-medium">{value || "-"}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" autoFocus={danger} className={btnGhostCls} onClick={onCancel}>{cfg.cancelLabel ?? (danger ? "Batal" : "Periksa lagi")}</button>
        <button type="button" autoFocus={!danger} className={danger ? DANGER_BTN : btnCls} onClick={onConfirm}>{cfg.confirmLabel ?? "Ya, sudah benar"}</button>
      </div>
    </Shell>
  );
}

/** Minta konfirmasi sebelum menjalankan aksi: ask({ ...teks, run }) lalu render `dialog`. */
export function useConfirm(): { ask: (cfg: ConfirmConfig) => void; dialog: ReactNode } {
  const [st, setSt] = useState<{ open: boolean; cfg: ConfirmConfig | null }>({ open: false, cfg: null });
  const close = () => setSt((s) => ({ ...s, open: false }));
  const { mounted, state } = usePresence(st.open);
  return {
    ask: (cfg) => setSt({ open: true, cfg }),
    dialog:
      mounted && st.cfg ? (
        <Confirm
          cfg={st.cfg}
          state={state}
          onCancel={close}
          onConfirm={() => {
            st.cfg?.run();
            close();
          }}
        />
      ) : null,
  };
}

export interface PromptConfig {
  title: string;
  label: string;
  initial?: string;
  confirmLabel?: string;
  maxLength?: number;
  run: (value: string) => void;
}

function PromptForm({ cfg, state, onCancel, onSubmit }: { cfg: PromptConfig; state: State; onCancel: () => void; onSubmit: (v: string) => void }) {
  const [value, setValue] = useState(cfg.initial ?? "");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <Shell state={state} onCancel={onCancel} labelId="prompt-title" role="dialog">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}>
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold-ink">
          <Pencil className="size-6" />
        </div>
        <h2 id="prompt-title" className="mb-4 text-center text-lg font-semibold tracking-tight">{cfg.title}</h2>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">{cfg.label}</span>
          <input ref={ref} className={inputCls} maxLength={cfg.maxLength} value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" className={btnGhostCls} onClick={onCancel}>Batal</button>
          <button className={btnCls}>{cfg.confirmLabel ?? "Simpan"}</button>
        </div>
      </form>
    </Shell>
  );
}

/** Pengganti prompt() bawaan browser: isian teks dalam pop up. */
export function usePrompt(): { ask: (cfg: PromptConfig) => void; dialog: ReactNode } {
  const [st, setSt] = useState<{ open: boolean; cfg: PromptConfig | null }>({ open: false, cfg: null });
  const close = () => setSt((s) => ({ ...s, open: false }));
  const { mounted, state } = usePresence(st.open);
  return {
    ask: (cfg) => setSt({ open: true, cfg }),
    dialog:
      mounted && st.cfg ? (
        <PromptForm
          cfg={st.cfg}
          state={state}
          onCancel={close}
          onSubmit={(v) => {
            st.cfg?.run(v);
            close();
          }}
        />
      ) : null,
  };
}
