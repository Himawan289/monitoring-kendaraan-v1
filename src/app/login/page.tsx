"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Check, Loader2, LogIn } from "lucide-react";
import { clsx } from "clsx";
import { Card, Field, btnCls, inputCls } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

const WELCOME_MS = 1300;

function Welcome() {
  return (
    <div className="anim-fade-in fixed inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-base/95 backdrop-blur-md">
      <svg viewBox="0 0 64 64" className="anim-pop size-24 text-gold-ink" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle className="anim-draw" cx="32" cy="32" r="28" pathLength="1" />
        <path className="anim-draw" d="M20 33l8 8 16-17" pathLength="1" />
      </svg>
      <div className="anim-fade-up text-center" style={{ animationDelay: "0.25s" }}>
        <p className="text-xl font-semibold tracking-tight">Selamat datang</p>
        <p className="mt-1 text-sm text-muted">Menyiapkan data kendaraan Anda…</p>
      </div>
      <div className="relative h-8 w-48 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-px bg-line" />
        <Car className="anim-drive absolute left-1/2 top-0 size-6 -translate-x-1/2 text-gold-ink" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [welcome, setWelcome] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    if (error) {
      setMsg("Email atau kata sandi salah.");
      setShake(true);
      setBusy(false);
      return;
    }
    setWelcome(true);
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, WELCOME_MS);
  }

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="anim-float absolute -left-24 top-10 size-96 rounded-full bg-gold/15 blur-3xl" />
        <div className="anim-float absolute -right-24 bottom-0 size-[28rem] rounded-full bg-gold/10 blur-3xl" style={{ animationDelay: "-7s" }} />
      </div>
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-10">
        <div className="anim-fade-up text-center">
          <h1 className="mb-1 text-3xl font-semibold tracking-tight">
            Monitoring <span className="text-gold-ink">Kendaraan</span>
          </h1>
          <p className="mb-8 text-sm text-muted">Masuk untuk melanjutkan. Akun dibuat oleh admin.</p>
        </div>
        <div className={clsx("anim-fade-up", shake && "anim-shake")} style={{ animationDelay: "0.12s" }} onAnimationEnd={() => setShake(false)}>
          <Card>
            <form onSubmit={submit} className="space-y-4">
              <Field label="Email"><input type="email" required autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="Kata sandi"><input type="password" required minLength={8} autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
              {msg && <p role="alert" className="anim-fade-in text-xs text-warn">{msg}</p>}
              <button className={btnCls + " w-full"} disabled={busy || welcome}>
                {busy ? <Loader2 className="anim-spin size-4" /> : welcome ? <Check className="size-4" /> : <LogIn className="size-4" />} {busy ? "Memeriksa…" : "Masuk"}
              </button>
            </form>
          </Card>
        </div>
      </div>
      {welcome && <Welcome />}
    </>
  );
}
