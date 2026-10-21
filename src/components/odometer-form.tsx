"use client";
import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Card, Field, btnCls, inputCls } from "./ui";
import { currentOdometer } from "@/lib/reminders";
import { today, uid, useAppState } from "@/lib/store";

export function OdometerForm() {
  const { state, update } = useAppState();
  const [km, setKm] = useState("");
  const [date, setDate] = useState(today());

  const last = currentOdometer(state);
  const kmNum = Number(km);
  const suspicious = km !== "" && last > 0 && kmNum < last;

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!kmNum) return;
    update((s) => ({ ...s, odometerLogs: [{ id: uid(), date, km: kmNum, source: "manual" }, ...s.odometerLogs] }));
    setKm("");
  }

  const history = [...state.odometerLogs].sort((a, b) => b.date.localeCompare(a.date) || b.km - a.km);

  return (
    <div className="space-y-5">
      <Card>
        <form onSubmit={save} className="space-y-4">
          <Field label={`Kilometer (terakhir: ${last.toLocaleString("id-ID")} km)`}>
            <input
              className={inputCls + " text-lg font-semibold tabular-nums"}
              inputMode="numeric"
              value={km}
              onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
              placeholder="mis. 21988"
              autoFocus
            />
          </Field>
          {suspicious && (
            <p className="rounded-lg bg-amber-500/10 p-2.5 text-xs text-warn">
              Lebih kecil dari odometer terakhir ({last.toLocaleString("id-ID")} km). Pastikan angka benar.
            </p>
          )}
          <Field label="Tanggal">
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <button className={btnCls + " w-full"} disabled={!kmNum}>
            <Check className="size-4" /> Simpan
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Riwayat odometer</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">Belum ada catatan.</p>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-medium tabular-nums">{l.km.toLocaleString("id-ID")} km</p>
                  <p className="text-xs text-muted">{l.date}</p>
                </div>
                <button
                  aria-label="Hapus"
                  className="text-muted/70 hover:text-bad"
                  onClick={() => update((s) => ({ ...s, odometerLogs: s.odometerLogs.filter((x) => x.id !== l.id) }))}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
