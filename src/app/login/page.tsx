"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Card, Field, btnCls, inputCls } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) setMsg("Email atau kata sandi salah.");
    else {
      router.replace("/");
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        Monitoring <span className="text-gold-ink">Kendaraan</span>
      </h1>
      <p className="mb-6 text-sm text-muted">Masuk untuk melanjutkan. Akun dibuat oleh admin.</p>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email"><input type="email" required autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Kata sandi"><input type="password" required minLength={8} autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          {msg && <p className="text-xs text-warn">{msg}</p>}
          <button className={btnCls + " w-full"} disabled={busy}><LogIn className="size-4" /> Masuk</button>
        </form>
      </Card>
    </div>
  );
}
