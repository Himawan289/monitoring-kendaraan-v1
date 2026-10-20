"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, Empty, Field, PageHeader, btnCls, inputCls } from "@/components/ui";
import { fuelStats } from "@/lib/fuel";
import { currentOdometer } from "@/lib/reminders";
import { today, uid, useAppState } from "@/lib/store";

const num = (s: string) => Number(s.replace(",", ".")) || 0;
const rp = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

export default function Page() {
  const { state, update } = useAppState();
  const odo = currentOdometer(state);
  const [f, setF] = useState({ date: today(), km: "", liters: "", cost: "", full: true });
  const stats = fuelStats(state.fuelLogs);
  const logs = [...state.fuelLogs].sort((a, b) => b.km - a.km || b.date.localeCompare(a.date));

  function add(e: React.FormEvent) {
    e.preventDefault();
    const liters = num(f.liters);
    if (liters <= 0) return;
    update((s) => ({
      ...s,
      fuelLogs: [{ id: uid(), date: f.date, km: Number(f.km || odo), liters, cost: num(f.cost), full: f.full }, ...s.fuelLogs],
    }));
    setF({ ...f, km: "", liters: "", cost: "" });
  }

  return (
    <>
      <PageHeader title="Catatan BBM" subtitle="Konsumsi dihitung dari jarak antar-pengisian penuh." />
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Card><p className="text-xs text-muted">Rata-rata</p><p className="mt-1 text-lg font-semibold">{stats.avgKmPerL ? `${stats.avgKmPerL.toFixed(1)} km/L` : "-"}</p></Card>
        <Card><p className="text-xs text-muted">Biaya / km</p><p className="mt-1 text-lg font-semibold">{stats.costPerKm ? rp(stats.costPerKm) : "-"}</p></Card>
        <Card><p className="text-xs text-muted">Total BBM</p><p className="mt-1 text-lg font-semibold">{rp(stats.totalCost)}</p></Card>
      </div>

      <Card className="mb-5">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <Field label="Tanggal"><input type="date" required className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label={`Kilometer (kosong = ${odo.toLocaleString("id-ID")})`}><input inputMode="numeric" className={inputCls} value={f.km} onChange={(e) => setF({ ...f, km: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label="Liter"><input inputMode="decimal" required className={inputCls} value={f.liters} onChange={(e) => setF({ ...f, liters: e.target.value })} /></Field>
          <Field label="Total harga (Rp)"><input inputMode="numeric" className={inputCls} value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value.replace(/\D/g, "") })} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" className="size-4 accent-[#e6b92e]" checked={f.full} onChange={(e) => setF({ ...f, full: e.target.checked })} /> Diisi penuh (dipakai untuk hitung km/L)
          </label>
          <button className={btnCls + " sm:col-span-2"}><Plus className="size-4" /> Simpan</button>
        </form>
      </Card>

      {logs.length === 0 ? <Empty>Belum ada catatan BBM.</Empty> : (
        <ul className="space-y-3">
          {logs.map((l) => {
            const k = stats.kmPerL.get(l.id);
            return (
              <li key={l.id}>
                <Card className="flex items-start justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-medium">{l.liters.toLocaleString("id-ID")} L · {rp(l.cost)}</p>
                    <p className="text-muted">{l.date} · {l.km.toLocaleString("id-ID")} km{l.full ? "" : " · tidak penuh"}</p>
                    {k && <p className="mt-1 text-gold">{k.toFixed(1)} km/L</p>}
                  </div>
                  <button aria-label="Hapus" className="text-muted/70 hover:text-red-400" onClick={() => update((s) => ({ ...s, fuelLogs: s.fuelLogs.filter((x) => x.id !== l.id) }))}><Trash2 className="size-4" /></button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
