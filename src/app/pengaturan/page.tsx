"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Bike, Car, Plus, Trash2 } from "lucide-react";
import { Card, Field, PageHeader, btnCls, btnGhostCls, inputCls } from "@/components/ui";
import { notify } from "@/lib/notify";
import { useAppState, useVehicles } from "@/lib/store";
import type { VehicleType } from "@/lib/types";
import { clsx } from "clsx";
import type { AppState } from "@/lib/types";

const NUM: { key: keyof AppState["settings"]; label: string }[] = [
  { key: "oilIntervalKm", label: "Interval ganti oli (km)" },
  { key: "oilIntervalMonths", label: "Interval ganti oli (bulan)" },
  { key: "serviceIntervalKm", label: "Interval servis (km)" },
  { key: "serviceIntervalMonths", label: "Interval servis (bulan)" },
  { key: "tireIntervalDays", label: "Interval cek ban (hari)" },
];

function TypePicker({ value, onChange }: { value: VehicleType; onChange: (t: VehicleType) => void }) {
  return (
    <div className="flex shrink-0 rounded-full border border-line bg-base p-1">
      {(["motor", "mobil"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={clsx("rounded-full px-4 py-1.5 text-sm font-medium transition", value === t ? "bg-gold text-black" : "text-muted hover:text-fg")}
        >
          {t === "motor" ? "Motor" : "Mobil"}
        </button>
      ))}
    </div>
  );
}

function TelegramCard() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/notify").then((r) => r.json()).then((d) => setConfigured(d.configured)).catch(() => setConfigured(false));
  }, []);
  async function test() {
    setMsg("Mengirim…");
    const r = await notify("🔔 Tes notifikasi Monitoring Kendaraan berhasil.");
    setMsg(r.ok ? "Terkirim. Cek Telegram Anda." : `Gagal: ${r.error}`);
  }
  return (
    <Card className="mb-5">
      <h2 className="mb-1 text-sm font-semibold">Notifikasi Telegram</h2>
      <p className="mb-3 text-xs text-muted">
        {configured === null ? "Memeriksa…" : configured ? "Bot terhubung." : "Belum terhubung. Isi TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID di .env.local lalu restart server."}
      </p>
      <div className="flex items-center gap-3">
        <button type="button" className={btnCls} disabled={!configured} onClick={test}>Kirim pesan tes</button>
        {msg && <span className="text-xs text-muted">{msg}</span>}
      </div>
    </Card>
  );
}

function AccountCard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser().auth.getUser();
      setEmail(data.user?.email ?? "");
    })();
  }, []);
  async function out() {
    await supabaseBrowser().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return (
    <Card className="mb-5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">Akun</h2>
        <p className="truncate text-xs text-muted">{email || "…"}</p>
      </div>
      <button type="button" className={btnGhostCls + " shrink-0"} onClick={out}><LogOut className="size-4" /> Keluar</button>
    </Card>
  );
}

export default function Page() {
  const { state, update } = useAppState();
  const { vehicles, activeId, setActive, add, remove } = useVehicles();
  const [newName, setNewName] = useState("");
  return (
    <>
      <PageHeader title="Pengaturan" />
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold">Kendaraan</h2>
        <ul className="mb-3 divide-y divide-line">
          {vehicles.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-2 text-sm">
              <button onClick={() => setActive(v.id)} className={clsx("flex items-center gap-2", v.id === activeId ? "font-semibold text-gold" : "text-fg/90")}>
                {v.vehicle.type === "mobil" ? <Car className="size-4" /> : <Bike className="size-4" />}
                {v.vehicle.name}
                {v.vehicle.plate && <span className="text-muted">· {v.vehicle.plate}</span>}
                {v.id === activeId && <span className="text-xs">(aktif)</span>}
              </button>
              {vehicles.length > 1 && (
                <button
                  aria-label="Hapus kendaraan"
                  className="text-muted/70 hover:text-red-400"
                  onClick={() => confirm(`Hapus ${v.vehicle.name} beserta semua datanya?`) && remove(v.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add(newName, "motor");
            setNewName("");
          }}
        >
          <input className={inputCls} placeholder="Nama kendaraan baru" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className={btnCls + " shrink-0"}><Plus className="size-4" /> Tambah</button>
        </form>
      </Card>
      <AccountCard />
      <TelegramCard />
      <h2 className="mb-2 text-sm font-semibold text-muted">Detail kendaraan aktif</h2>
      <Card className="mb-5 grid gap-3 sm:grid-cols-2">
        <Field label="Nama kendaraan"><input className={inputCls} value={state.vehicle.name} onChange={(e) => update((s) => ({ ...s, vehicle: { ...s.vehicle, name: e.target.value } }))} /></Field>
        <Field label="Jenis kendaraan">
          <TypePicker value={state.vehicle.type} onChange={(t) => update((s) => ({ ...s, vehicle: { ...s.vehicle, type: t } }))} />
        </Field>
        <Field label="Plat nomor"><input className={inputCls} value={state.vehicle.plate} onChange={(e) => update((s) => ({ ...s, vehicle: { ...s.vehicle, plate: e.target.value } }))} /></Field>
      </Card>
      <Card className="grid gap-3 sm:grid-cols-2">
        {NUM.map(({ key, label }) => (
          <Field key={key} label={label}>
            <input inputMode="numeric" className={inputCls} value={state.settings[key]} onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, [key]: Number(e.target.value.replace(/\D/g, "")) } }))} />
          </Field>
        ))}
      </Card>
    </>
  );
}
