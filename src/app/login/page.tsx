"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Card, Field, btnCls, inputCls } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const sb = supabaseBrowser();
    if (mode === "masuk") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setMsg("Email atau kata sandi salah.");
      else {
        router.replace("/");
        router.refresh();
      }
    } else {
      const { error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
      setMsg(error ? error.message : "Cek email Anda untuk konfirmasi, lalu masuk.");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        Monitoring <span className="text-gold">Kendaraan</span>
      </h1>
      <p className="mb-6 text-sm text-muted">{mode === "masuk" ? "Masuk untuk melanjutkan." : "Buat akun pemilik."}</p>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email"><input type="email" required autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Kata sandi"><input type="password" required minLength={8} autoComplete={mode === "masuk" ? "current-password" : "new-password"} className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          {msg && <p className="text-xs text-amber-400">{msg}</p>}
          <button className={btnCls + " w-full"} disabled={busy}><LogIn className="size-4" /> {mode === "masuk" ? "Masuk" : "Daftar"}</button>
        </form>
        <button type="button" className="mt-4 text-xs text-muted hover:text-fg" onClick={() => { setMode(mode === "masuk" ? "daftar" : "masuk"); setMsg(""); }}>
          {mode === "masuk" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </Card>
    </div>
  );
}
