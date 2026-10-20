import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Klien dengan sesi pengguna dari cookie (patuh RLS). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // dipanggil dari Server Component: sesi disegarkan oleh proxy
        }
      },
    },
  });
}

/** Klien service role: hanya untuk webhook/cron, melewati RLS. */
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

/** Pengguna yang login dan sama dengan OWNER_EMAIL; selain itu null. */
export async function requireOwner() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const user = data.user;
  if (!user || !owner || user.email?.toLowerCase() !== owner) return null;
  return { user, sb };
}
