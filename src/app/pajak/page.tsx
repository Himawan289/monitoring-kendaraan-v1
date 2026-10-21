"use client";
import { Card, Field, PageHeader, StatusBadge, inputCls } from "@/components/ui";
import { TAX_MILESTONES, taxReminder } from "@/lib/reminders";
import { useAppState } from "@/lib/store";

export default function Page() {
  const { state, update } = useAppState();
  const items = [
    { key: "annualDue" as const, title: "Pajak tahunan (1 tahun)" },
    { key: "stnkDue" as const, title: "STNK (5 tahun)" },
  ];
  return (
    <>
      <PageHeader title="Pajak Kendaraan" subtitle={`Pengingat visual H-${TAX_MILESTONES.join(", H-")} sebelum jatuh tempo.`} />
      <div className="space-y-4">
        {items.map(({ key, title }) => {
          const r = taxReminder(title, state.taxes[key]);
          return (
            <Card key={key}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-medium">{title}</h2>
                <StatusBadge level={r.level} />
              </div>
              <Field label="Tanggal jatuh tempo">
                <input type="date" className={inputCls} value={state.taxes[key]} onChange={(e) => update((s) => ({ ...s, taxes: { ...s.taxes, [key]: e.target.value } }))} />
              </Field>
              <p className="mt-3 text-sm text-muted">{r.detail}</p>
              <div className="mt-3 flex gap-2">
                {TAX_MILESTONES.map((m) => (
                  <span key={m} className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ${r.days !== undefined && r.days <= m ? (r.days < 0 ? "bg-red-500/10 text-bad ring-red-500/30" : "bg-amber-500/10 text-warn ring-amber-500/30") : "bg-card/5 text-muted/70 ring-white/10"}`}>
                    H-{m}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
