"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, Empty, Field, PageHeader, StatusBadge, btnCls, inputCls } from "@/components/ui";
import { tireReminder } from "@/lib/reminders";
import { today, uid, useAppState } from "@/lib/store";

export default function Page() {
  const { state, update } = useAppState();
  const [f, setF] = useState({ date: today(), front: "", rear: "", notes: "" });
  const r = tireReminder(state);
  const logs = [...state.tireLogs].sort((a, b) => b.date.localeCompare(a.date));

  function add(e: React.FormEvent) {
    e.preventDefault();
    update((s) => ({
      ...s,
      tireLogs: [{ id: uid(), date: f.date, front: f.front ? Number(f.front) : undefined, rear: f.rear ? Number(f.rear) : undefined, notes: f.notes }, ...s.tireLogs],
    }));
    setF({ ...f, front: "", rear: "", notes: "" });
  }

  return (
    <>
      <PageHeader title="Tekanan Ban" subtitle={`Pengingat cek tiap ${state.settings.tireIntervalDays} hari (ubah di Pengaturan).`} />
      <Card className="mb-5">
        <div className="flex items-center justify-between"><span className="text-sm text-muted">{r.detail}</span><StatusBadge level={r.level} /></div>
      </Card>
      <Card className="mb-5">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-3">
          <Field label="Tanggal"><input type="date" required className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Depan (PSI)"><input inputMode="decimal" className={inputCls} value={f.front} onChange={(e) => setF({ ...f, front: e.target.value })} /></Field>
          <Field label="Belakang (PSI)"><input inputMode="decimal" className={inputCls} value={f.rear} onChange={(e) => setF({ ...f, rear: e.target.value })} /></Field>
          <div className="sm:col-span-3"><Field label="Catatan"><input className={inputCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field></div>
          <button className={btnCls + " sm:col-span-3"}><Plus className="size-4" /> Catat cek/isi angin</button>
        </form>
      </Card>
      {logs.length === 0 ? <Empty>Belum ada log tekanan ban.</Empty> : (
        <ul className="space-y-3">
          {logs.map((l) => (
            <li key={l.id}>
              <Card className="flex items-start justify-between">
                <div className="text-sm">
                  <p className="font-medium">{l.date}</p>
                  <p className="text-muted">Depan {l.front ?? "-"} · Belakang {l.rear ?? "-"} PSI</p>
                  {l.notes && <p className="text-muted">{l.notes}</p>}
                </div>
                <button aria-label="Hapus" className="text-muted/70 hover:text-red-400" onClick={() => update((s) => ({ ...s, tireLogs: s.tireLogs.filter((x) => x.id !== l.id) }))}><Trash2 className="size-4" /></button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
