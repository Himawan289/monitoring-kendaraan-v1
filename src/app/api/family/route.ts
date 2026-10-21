import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/server-state";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";

/** Satu keluarga berbagi satu data: id pemilik data (akun admin) dipakai semua pengguna. */
export async function GET() {
  if (!(await requireUser())) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const id = await getOwnerId(supabaseAdmin());
  if (!id) return NextResponse.json({ error: "OWNER_EMAIL belum diatur" }, { status: 500 });
  return NextResponse.json({ id });
}
