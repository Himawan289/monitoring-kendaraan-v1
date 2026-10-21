import { NextResponse } from "next/server";
import { requireOwner, supabaseAdmin } from "@/lib/supabase/server";

const DENIED = NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

export async function GET() {
  if (!(await requireOwner())) return DENIED;
  const { data, error } = await supabaseAdmin().auth.admin.listUsers({ perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const users = data.users.map((u) => ({ id: u.id, email: u.email ?? "", name: typeof u.user_metadata?.name === "string" ? u.user_metadata.name : "", createdAt: u.created_at }));
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  if (!(await requireOwner())) return DENIED;
  const { email, password, name } = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown; name?: unknown };
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Kata sandi minimal 8 karakter" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin().auth.admin.createUser({ email: email.trim(), password, email_confirm: true, user_metadata: { name: typeof name === "string" ? name.trim().slice(0, 40) : "" } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.user.id });
}

export async function PATCH(req: Request) {
  if (!(await requireOwner())) return DENIED;
  const { id, name } = (await req.json().catch(() => ({}))) as { id?: unknown; name?: unknown };
  if (typeof id !== "string" || !id || typeof name !== "string") return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const { error } = await supabaseAdmin().auth.admin.updateUserById(id, { user_metadata: { name: name.trim().slice(0, 40) } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const owner = await requireOwner();
  if (!owner) return DENIED;
  const { id } = (await req.json().catch(() => ({}))) as { id?: unknown };
  if (typeof id !== "string" || !id) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  if (id === owner.user.id) return NextResponse.json({ error: "Admin tidak bisa menghapus dirinya sendiri" }, { status: 400 });
  const { error } = await supabaseAdmin().auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
