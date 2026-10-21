import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabase/server";
import { normalize } from "./root-ops";
import type { Root } from "./types";

let ownerId: string | undefined;

/** Id pengguna pemilik (dari OWNER_EMAIL) untuk webhook/cron yang tidak punya sesi login. */
export async function getOwnerId(admin: SupabaseClient): Promise<string | null> {
  if (ownerId) return ownerId;
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!email) return null;
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  ownerId = data?.users.find((u) => u.email?.toLowerCase() === email)?.id;
  return ownerId ?? null;
}

export async function loadUserState(admin: SupabaseClient, userId: string): Promise<{ root: Root; version: number } | null> {
  const { data } = await admin.from("app_state").select("data,version").eq("user_id", userId).maybeSingle();
  return data ? { root: normalize(data.data as Root), version: data.version as number } : null;
}

/** Ubah data satu pengguna dengan kontrol versi; fn dijalankan ulang bila ada tulisan bersamaan. */
export async function mutateUserState<T>(
  userId: string,
  fn: (root: Root) => { root: Root; result: T },
): Promise<{ before: Root; after: Root; result: T } | null> {
  const admin = supabaseAdmin();
  for (let attempt = 0; attempt < 4; attempt++) {
    const cur = await loadUserState(admin, userId);
    if (!cur) return null;
    const { root: next, result } = fn(cur.root);
    if (next === cur.root) return { before: cur.root, after: cur.root, result };
    const { data } = await admin
      .from("app_state")
      .update({ data: next, version: cur.version + 1, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("version", cur.version)
      .select("version");
    if (data?.length === 1) return { before: cur.root, after: next, result };
  }
  return null;
}
