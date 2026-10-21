"use client";
import { useEffect, useState } from "react";
import { LogOut, Monitor, Moon, Sun, UserPlus } from "lucide-react";
import { Bike, Car, Pencil, Trash2 } from "lucide-react";
import { Card, Field, PageHeader, btnCls, btnGhostCls, inputCls } from "@/components/ui";
import { THEMES, setTheme, useTheme } from "@/lib/theme";
import { TypePicker } from "@/components/type-picker";
import { useConfirm, usePrompt } from "@/components/confirm-dialog";
import { LogoutDialog } from "@/components/logout-dialog";
import { toastSuccess } from "@/lib/toast";
import { saveName, useProfile } from "@/lib/profile";
import { serviceMonthsFor } from "@/lib/defaults";
import { notify } from "@/lib/notify";
import { useAppState, useVehicles } from "@/lib/store";
import { clsx } from "clsx";
import type { AppState } from "@/lib/types";

const ROW_OUT_MS = 360;

const NUM: { key: keyof AppState["settings"]; label: string }[] = [
  { key: "oilIntervalKm", label: "Interval ganti oli (km)" },
  { key: "oilIntervalMonths", label: "Interval ganti oli (bulan)" },
  { key: "serviceIntervalKm", label: "Interval servis (km)" },
  { key: "serviceIntervalMonths", label: "Interval servis (bulan)" },
  { key: "tireIntervalDays", label: "Interval cek ban (hari)" },
];

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
    else setMsg(`Gagal membuat kode: ${(await r.json().catch(() => null))?.error ?? r.status}`);
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
  const [confirming, setConfirming] = useState(false);
  const { name: saved, email, loaded } = useProfile();
  return (
    <>
      <Card className="mb-5">
        <h2 className="mb-3 text-sm font-semibold">Profil</h2>
        {loaded && <NameForm key={saved} initial={saved} />}
        <p className="mt-3 truncate text-xs text-muted">Email: {email || "…"}</p>
      </Card>
      <Card className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Keluar</h2>
          <p className="text-xs text-muted">Akhiri sesi di perangkat ini.</p>
        </div>
        <button type="button" className={btnGhostCls + " shrink-0"} onClick={() => setConfirming(true)}><LogOut className="size-4" /> Keluar</button>
        <LogoutDialog open={confirming} onClose={() => setConfirming(false)} />
      </Card>
    </>
  );
}

function NameForm({ initial }: { initial: string }) {
  const [name, setName] = useState(initial);
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = await saveName(name);
    setMsg(err ?? "Nama disimpan.");
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input className={inputCls} placeholder="Nama tampilan, mis. Ayah" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
      <button className={btnCls + " shrink-0"} disabled={name.trim() === initial}>Simpan</button>
      {msg && <span className="sr-only" role="status">{msg}</span>}
    </form>
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
  const [users, setUsers] = useState<{ id: string; email: string; name: string }[] | null>(null);
  const [name, setName] = useState("");
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
  const { ask, dialog } = useConfirm();
  const rename = usePrompt();
  const [removing, setRemoving] = useState<string | null>(null);
  async function create() {
    const r = await fetch("/api/admin/users", { method: "POST", body: JSON.stringify({ name, email, password }) });
    const d = await r.json();
    setMsg(r.ok ? "Pengguna ditambahkan." : d.error);
    if (r.ok) {
      setName("");
      setEmail("");
      setPassword("");
      load();
    }
  }
  function add(e: React.FormEvent) {
    e.preventDefault();
    ask({ rows: [["Nama", name.trim()], ["Email", email.trim()]], confirmLabel: "Ya, buat akun", run: create });
  }
  function askRename(id: string, current: string) {
    rename.ask({
      title: "Ubah nama tampilan",
      label: "Nama",
      initial: current,
      maxLength: 40,
      run: async (next) => {
        const r = await fetch("/api/admin/users", { method: "PATCH", body: JSON.stringify({ id, name: next }) });
        if (!r.ok) setMsg((await r.json()).error);
        load();
      },
    });
  }
  async function del(id: string, label: string) {
    setRemoving(id);
    const [r] = await Promise.all([fetch("/api/admin/users", { method: "DELETE", body: JSON.stringify({ id }) }), new Promise((res) => setTimeout(res, ROW_OUT_MS))]);
    if (r.ok) {
      setUsers((list) => list?.filter((u) => u.id !== id) ?? null); // hindari baris muncul lagi sebelum daftar dimuat ulang
      toastSuccess(`${label} berhasil dihapus`);
    } else setMsg((await r.json()).error);
    setRemoving(null);
    load();
  }
  if (!users) return null;
  return (
    <Card className="mb-5">
      <h2 className="mb-1 text-sm font-semibold">Pengguna (admin)</h2>
      <p className="mb-3 text-xs text-muted">Pendaftaran umum ditutup. Hanya admin yang bisa membuat akun.</p>
      <ul className="mb-3 divide-y divide-line">
        {users.map((u) => (
          <li key={u.id} className={clsx("flex items-center justify-between py-2 text-sm", removing === u.id && "anim-row-out")}>
            <span className="min-w-0 flex-1 truncate">
              {u.name ? <><span className="font-medium">{u.name}</span> <span className="text-muted">· {u.email}</span></> : u.email}
            </span>
            <button aria-label="Ubah nama" className="mr-3 shrink-0 text-muted/70 hover:text-fg" onClick={() => askRename(u.id, u.name)}>
              <Pencil className="size-4" />
            </button>
            <button aria-label="Hapus pengguna" className="shrink-0 text-muted/70 hover:text-bad" onClick={() => ask({ title: "Hapus pengguna?", message: `Akun ${u.name || u.email} akan dihapus dan tidak bisa masuk lagi.`, tone: "danger", confirmLabel: "Ya, hapus", run: () => del(u.id, u.name || u.email) })}>
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="grid gap-2 sm:grid-cols-2">
        <input required maxLength={40} className={inputCls} placeholder="Nama (mis. Ayah)" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="email" required className={inputCls} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="text" required minLength={8} className={inputCls} placeholder="Kata sandi (min. 8)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className={btnCls + " sm:col-span-2"}><UserPlus className="size-4" /> Tambah pengguna</button>
      </form>
      {msg && <p className="mt-2 text-xs text-warn">{msg}</p>}
      {dialog}
      {rename.dialog}
    </Card>
  );
}

type TabId = "akun" | "tampilan" | "kendaraan" | "notifikasi" | "pengguna";

function VehiclesTab() {
  const { state, update } = useAppState();
  const { vehicles, activeId, setActive, remove } = useVehicles();
  const { ask, dialog } = useConfirm();
  const [removing, setRemoving] = useState<string | null>(null);
  function removeAnimated(id: string, name: string) {
    setRemoving(id);
    setTimeout(() => {
      remove(id);
      setRemoving(null);
      toastSuccess(`${name} berhasil dihapus`);
    }, ROW_OUT_MS);
  }
  return (
    <>
      <Card className="mb-5">
        <h2 className="mb-1 text-sm font-semibold">Daftar kendaraan</h2>
        <p className="mb-3 text-xs text-muted">Untuk menambah kendaraan, buka pemilih kendaraan di bagian atas lalu pilih “Tambah kendaraan”.</p>
        <ul className="divide-y divide-line">
          {vehicles.map((v) => (
            <li key={v.id} className={clsx("flex items-center justify-between py-2 text-sm", removing === v.id && "anim-row-out")}>
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
                  onClick={() => ask({ title: "Hapus kendaraan?", message: `${v.vehicle.name} beserta semua riwayat servis, BBM, dan fotonya akan dihapus permanen.`, tone: "danger", confirmLabel: "Ya, hapus", run: () => removeAnimated(v.id, v.vehicle.name) })}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>
      {dialog}
      <h2 className="mb-2 text-sm font-semibold text-muted">Detail kendaraan aktif</h2>
      <Card className="mb-5 grid gap-3 sm:grid-cols-2">
        <Field label="Nama kendaraan"><input className={inputCls} value={state.vehicle.name} onChange={(e) => update((s) => ({ ...s, vehicle: { ...s.vehicle, name: e.target.value } }))} /></Field>
        <Field label="Jenis kendaraan">
          <TypePicker value={state.vehicle.type} onChange={(t) => update((s) => ({ ...s, vehicle: { ...s.vehicle, type: t }, settings: { ...s.settings, serviceIntervalMonths: serviceMonthsFor(t) } }))} />
        </Field>
        <Field label="Plat nomor"><input className={inputCls} value={state.vehicle.plate} onChange={(e) => update((s) => ({ ...s, vehicle: { ...s.vehicle, plate: e.target.value } }))} /></Field>
      </Card>
      <h2 className="mb-2 text-sm font-semibold text-muted">Interval pengingat</h2>
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

export default function Page() {
  const [tab, setTab] = useState<TabId>("akun");
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    fetch("/api/admin/users").then((r) => setAdmin(r.ok)).catch(() => setAdmin(false));
  }, []);
  const tabs: { id: TabId; label: string }[] = [
    { id: "akun", label: "Akun" },
    { id: "tampilan", label: "Tampilan" },
    { id: "kendaraan", label: "Kendaraan" },
    { id: "notifikasi", label: "Notifikasi" },
    ...(admin ? [{ id: "pengguna" as const, label: "Pengguna" }] : []),
  ];
  return (
    <>
      <PageHeader title="Pengaturan" />
      <div role="tablist" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
              tab === t.id ? "border-transparent bg-gold text-on-gold" : "border-line bg-card text-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "akun" && <AccountCard />}
      {tab === "tampilan" && <ThemeCard />}
      {tab === "kendaraan" && <VehiclesTab />}
      {tab === "notifikasi" && <TelegramCard />}
      {tab === "pengguna" && <UsersCard />}
    </>
  );
}
