"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, Empty, Field, PageHeader, StatusBadge, btnCls, inputCls } from "@/components/ui";
import { currentOdometer, serviceReminder } from "@/lib/reminders";
import { today, uid, useAppState } from "@/lib/store";
import type { ServiceLog } from "@/lib/types";

export default function Page() {
  const { state, update } = useAppState();
  const [f, setF] = useState({ type: "oli" as ServiceLog["type"], date: today(), km: "", cost: "", workshop: "", notes: "" });
  const odo = currentOdometer(state);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const km = Number(f.km || odo);
    update((s) => ({
      ...s,
      serviceLogs: [{ id: uid(), type: f.type, date: f.date, km, cost: Number(f.cost) || 0, workshop: f.workshop, notes: f.notes }, ...s.serviceLogs],
    }));
    setF({ ...f, km: "", cost: "", workshop: "", notes: "" });
  }

  const logs = [...state.serviceLogs].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHeader title="Servis & Ganti Oli" subtitle="Jadwal berikutnya dihitung dari interval km atau waktu, mana yang lebih dulu." />
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        {(["oli", "servis"] as const).map((t) => {
          const r = serviceReminder(state, t);
          return (
            <Card key={t}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-muted">{r.title}</span>
                <StatusBadge level={r.level} />
              </div>
              <p className="text-sm">{r.detail}</p>
            </Card>
          );
        })}
      </div>

      <Card className="mb-5">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <Field label="Jenis">
            <select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as ServiceLog["type"] })}>
              <option value="oli">Ganti oli</option>
              <option value="servis">Servis berkala</option>
            </select>
          </Field>
          <Field label="Tanggal"><input type="date" required className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label={`Kilometer (kosong = ${odo.toLocaleString("id-ID")})`}><input inputMode="numeric" className={inputCls} value={f.km} onChange={(e) => setF({ ...f, km: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label="Biaya (Rp)"><input inputMode="numeric" className={inputCls} value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label="Bengkel"><input className={inputCls} value={f.workshop} onChange={(e) => setF({ ...f, workshop: e.target.value })} /></Field>
          <Field label="Catatan"><input className={inputCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          <button className={btnCls + " sm:col-span-2"}><Plus className="size-4" /> Simpan catatan</button>
        </form>
      </Card>

      {logs.length === 0 ? <Empty>Belum ada riwayat servis.</Empty> : (
        <ul className="space-y-3">
          {logs.map((l) => (
            <li key={l.id}>
              <Card className="flex items-start justify-between gap-3">
                <div className="text-sm">
                  <p className="font-medium">{l.type === "oli" ? "Ganti oli" : "Servis berkala"} · {l.km.toLocaleString("id-ID")} km</p>
                  <p className="text-muted">{l.date}{l.workshop && ` · ${l.workshop}`} · Rp {l.cost.toLocaleString("id-ID")}</p>
                  {l.notes && <p className="mt-1 text-muted">{l.notes}</p>}
                </div>
                <button aria-label="Hapus" className="text-muted/70 hover:text-red-400" onClick={() => update((s) => ({ ...s, serviceLogs: s.serviceLogs.filter((x) => x.id !== l.id) }))}>
                  <Trash2 className="size-4" />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
