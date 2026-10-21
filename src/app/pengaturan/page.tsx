"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Monitor, Moon, Sun, UserPlus } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Bike, Car, Plus, Trash2 } from "lucide-react";
import { Card, Field, PageHeader, btnCls, btnGhostCls, inputCls } from "@/components/ui";
import { THEMES, setTheme, useTheme } from "@/lib/theme";
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
          className={clsx("rounded-full px-4 py-1.5 text-sm font-medium transition", value === t ? "bg-gold text-on-gold" : "text-muted hover:text-fg")}
        >
          {t === "motor" ? "Motor" : "Mobil"}
        </button>
      ))}
    </div>
  );
}

function TelegramCard() {
  const [status, setStatus] = useState<{ configured: boolean; linked: boolean; viaEnv?: boolean } | null>(null);
  const [link, setLink] = useState<{ code: string; bot: string | null } | null>(null);
  const [msg, setMsg] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    fetch("/api/notify").then((r) => r.json()).then(setStatus).catch(() => setStatus({ configured: false, linked: false }));
  }, [tick]);
  async function test() {
    setMsg("Mengirim…");
    const r = await notify("🔔 Tes notifikasi Monitoring Kendaraan berhasil.");
    setMsg(r.ok ? "Terkirim. Cek Telegram Anda." : `Gagal: ${r.error}`);
  }
  async function connect() {
    const r = await fetch("/api/telegram/link", { method: "POST" });
    if (r.ok) setLink(await r.json());
  }
  async function disconnect() {
    await fetch("/api/telegram/link", { method: "DELETE" });
    setLink(null);
    setMsg("");
    setTick((t) => t + 1);
  }
  return (
    <Card className="mb-5">
      <h2 className="mb-1 text-sm font-semibold">Notifikasi Telegram</h2>
      <p className="mb-3 text-xs text-muted">
        {status === null ? "Memeriksa…" : !status.configured ? "Bot belum dikonfigurasi di server." : status.linked ? (status.viaEnv ? "Terhubung sebagai admin (diatur di server lewat TELEGRAM_CHAT_ID, tidak bisa diputus dari sini)." : "Telegram terhubung.") : "Belum terhubung."}
      </p>
      {status?.configured && !status.linked && !link && <button type="button" className={btnCls} onClick={connect}>Hubungkan Telegram</button>}
      {link && !status?.linked && (
        <div className="space-y-2 text-xs text-muted">
          <p>Kirim pesan ini ke bot (berlaku 10 menit, sekali pakai):</p>
          <p className="select-all rounded-2xl border border-line bg-base px-4 py-2.5 font-mono text-sm text-fg">/hubungkan {link.code}</p>
          {link.bot && <a className="inline-block text-gold-ink underline" href={`https://t.me/${link.bot}?start=${link.code}`} target="_blank" rel="noreferrer">Buka @{link.bot} di Telegram</a>}
          <div><button type="button" className={btnGhostCls} onClick={() => setTick((t) => t + 1)}>Sudah saya kirim</button></div>
        </div>
      )}
      {status?.linked && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={btnCls} onClick={test}>Kirim pesan tes</button>
          {!status.viaEnv && <button type="button" className={btnGhostCls} onClick={disconnect}>Putuskan</button>}
        </div>
      )}
      {msg && <p className="mt-2 text-xs text-muted">{msg}</p>}
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

function ThemeCard() {
  const theme = useTheme();
  const icons = { system: Monitor, light: Sun, dark: Moon };
  return (
    <Card className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold">Tampilan</h2>
        <p className="text-xs text-muted">Otomatis mengikuti pengaturan perangkat.</p>
      </div>
      <div className="flex shrink-0 rounded-full border border-line bg-base p-1">
        {THEMES.map(({ value, label }) => {
          const Icon = icons[value];
          return (
            <button
              key={value}
              type="button"
              aria-label={label}
              aria-pressed={theme === value}
              title={label}
              onClick={() => setTheme(value)}
              className={clsx("flex size-8 items-center justify-center rounded-full transition", theme === value ? "bg-gold text-on-gold" : "text-muted hover:text-fg")}
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function UsersCard() {
  const [users, setUsers] = useState<{ id: string; email: string }[] | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : { users: null }))
      .then((d) => setUsers(d.users))
      .catch(() => setUsers(null));
  }, [tick]);
  const load = () => setTick((t) => t + 1);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/admin/users", { method: "POST", body: JSON.stringify({ email, password }) });
    const d = await r.json();
    setMsg(r.ok ? "Pengguna ditambahkan." : d.error);
    if (r.ok) {
      setEmail("");
      setPassword("");
      load();
    }
  }
  async function del(id: string) {
    const r = await fetch("/api/admin/users", { method: "DELETE", body: JSON.stringify({ id }) });
    if (!r.ok) setMsg((await r.json()).error);
    load();
  }
  if (!users) return null;
  return (
    <Card className="mb-5">
      <h2 className="mb-1 text-sm font-semibold">Pengguna (admin)</h2>
      <p className="mb-3 text-xs text-muted">Pendaftaran umum ditutup. Hanya admin yang bisa membuat akun.</p>
      <ul className="mb-3 divide-y divide-line">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between py-2 text-sm">
            <span className="truncate">{u.email}</span>
            <button aria-label="Hapus pengguna" className="shrink-0 text-muted/70 hover:text-bad" onClick={() => confirm(`Hapus ${u.email} beserta semua datanya?`) && del(u.id)}>
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input type="email" required className={inputCls} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="text" required minLength={8} className={inputCls} placeholder="Kata sandi (min. 8)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className={btnCls}><UserPlus className="size-4" /> Tambah</button>
      </form>
      {msg && <p className="mt-2 text-xs text-warn">{msg}</p>}
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
              <button onClick={() => setActive(v.id)} className={clsx("flex items-center gap-2", v.id === activeId ? "font-semibold text-gold-ink" : "text-fg/90")}>
                {v.vehicle.type === "mobil" ? <Car className="size-4" /> : <Bike className="size-4" />}
                {v.vehicle.name}
                {v.vehicle.plate && <span className="text-muted">· {v.vehicle.plate}</span>}
                {v.id === activeId && <span className="text-xs">(aktif)</span>}
              </button>
              {vehicles.length > 1 && (
                <button
                  aria-label="Hapus kendaraan"
                  className="text-muted/70 hover:text-bad"
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
      <ThemeCard />
      <AccountCard />
      <UsersCard />
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
