"use client";
import { useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Card, Empty, Field, PageHeader, StatusBadge, btnCls, btnGhostCls, inputCls } from "@/components/ui";
import { useConfirm } from "@/components/confirm-dialog";
import { PART_PRESETS } from "@/lib/part-presets";
import { currentOdometer, partReminder } from "@/lib/reminders";
import { today, uid, useAppState } from "@/lib/store";

export default function Page() {
  const { state, update } = useAppState();
  const odo = currentOdometer(state);
  const used = new Set(state.parts.map((p) => p.name));
  const presets = PART_PRESETS[state.vehicle.type].filter((p) => !used.has(p.name));
  const blank = { name: "", km: "", months: "", lastKm: "", lastDate: today() };
  const [f, setF] = useState(blank);
  const { ask, dialog } = useConfirm();

  function pick(name: string) {
    const p = PART_PRESETS[state.vehicle.type].find((x) => x.name === name);
    setF(p ? { ...f, name: p.name, km: String(p.intervalKm ?? ""), months: String(p.intervalMonths ?? "") } : { ...f, name });
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const intervalKm = Number(f.km) || undefined;
    const intervalMonths = Number(f.months) || undefined;
    if (!f.name.trim() || (!intervalKm && !intervalMonths)) return;
    const lastKm = Number(f.lastKm || odo);
    const interval = [intervalKm && `${intervalKm.toLocaleString("id-ID")} km`, intervalMonths && `${intervalMonths} bulan`].filter(Boolean).join(" / ");
    ask({
      rows: [["Suku cadang", f.name.trim()], ["Interval", interval], ["Terakhir diganti", `${f.lastDate} · ${lastKm.toLocaleString("id-ID")} km`]],
      confirmLabel: "Ya, tambahkan",
      run: () => {
        update((s) => ({
          ...s,
          parts: [...s.parts, { id: uid(), name: f.name.trim(), intervalKm, intervalMonths, lastKm, lastDate: f.lastDate }],
        }));
        setF(blank);
      },
    });
  }

  return (
    <>
      <PageHeader title="Suku Cadang" subtitle="Pengingat penggantian berdasarkan km dan/atau waktu, mana yang lebih dulu." />
      <Card className="mb-5">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama suku cadang">
            <input list="presets" className={inputCls} value={f.name} onChange={(e) => pick(e.target.value)} placeholder="Pilih atau ketik sendiri" required />
            <datalist id="presets">{presets.map((p) => <option key={p.name} value={p.name} />)}</datalist>
          </Field>
          <Field label="Terakhir diganti (tanggal)"><input type="date" className={inputCls} value={f.lastDate} onChange={(e) => setF({ ...f, lastDate: e.target.value })} /></Field>
          <Field label="Interval (km)"><input inputMode="numeric" className={inputCls} value={f.km} onChange={(e) => setF({ ...f, km: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label="Interval (bulan)"><input inputMode="numeric" className={inputCls} value={f.months} onChange={(e) => setF({ ...f, months: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label={`Terakhir diganti di km (kosong = ${odo.toLocaleString("id-ID")})`}><input inputMode="numeric" className={inputCls} value={f.lastKm} onChange={(e) => setF({ ...f, lastKm: e.target.value.replace(/\D/g, "") })} /></Field>
          <div className="flex items-end"><button className={btnCls + " w-full"}><Plus className="size-4" /> Tambah</button></div>
        </form>
      </Card>
      {dialog}

      {state.parts.length === 0 ? <Empty>Belum ada suku cadang yang dipantau.</Empty> : (
        <ul className="space-y-3">
          {state.parts.map((p) => {
            const r = partReminder(state, p);
            return (
              <li key={p.id}>
                <Card>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-medium">{p.name}</span>
                    <StatusBadge level={r.level} />
                  </div>
                  <p className="text-sm">{r.detail}</p>
                  <p className="mt-1 text-xs text-muted">
                    Diganti {p.lastDate} di {p.lastKm.toLocaleString("id-ID")} km · tiap {[p.intervalKm && `${p.intervalKm.toLocaleString("id-ID")} km`, p.intervalMonths && `${p.intervalMonths} bulan`].filter(Boolean).join(" / ")}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className={btnGhostCls + " !px-4 !py-1.5"} onClick={() => update((s) => ({ ...s, parts: s.parts.map((x) => (x.id === p.id ? { ...x, lastKm: odo, lastDate: today() } : x)) }))}>
                      <RefreshCw className="size-4" /> Tandai sudah diganti
                    </button>
                    <button aria-label="Hapus" className="ml-auto text-muted/70 hover:text-bad" onClick={() => update((s) => ({ ...s, parts: s.parts.filter((x) => x.id !== p.id) }))}><Trash2 className="size-4" /></button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
