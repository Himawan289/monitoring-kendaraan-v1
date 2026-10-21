"use client";
import { useSyncExternalStore } from "react";
import { supabaseBrowser } from "./supabase/client";

export interface Profile {
  loaded: boolean;
  email: string;
  name: string;
}

const EMPTY: Profile = { loaded: false, email: "", name: "" };
let profile = EMPTY;
let started = false;
const listeners = new Set<() => void>();

function set(next: Profile) {
  profile = next;
  listeners.forEach((l) => l());
}

type AuthUser = { email?: string; user_metadata?: { name?: unknown } } | null | undefined;

function fromUser(u: AuthUser): Profile {
  const name = u?.user_metadata?.name;
  return { loaded: true, email: u?.email ?? "", name: typeof name === "string" ? name.trim() : "" };
}

function load() {
  if (started) return;
  started = true;
  supabaseBrowser().auth.getUser().then(({ data }: { data: { user: AuthUser } }) => set(fromUser(data.user)), () => set({ ...EMPTY, loaded: true }));
}

/** Simpan nama tampilan di metadata akun; null bila berhasil, selain itu pesan galat. */
export async function saveName(name: string): Promise<string | null> {
  const { data, error } = await supabaseBrowser().auth.updateUser({ data: { name: name.trim() } });
  if (error) return error.message;
  set(fromUser(data.user));
  return null;
}

export function useProfile(): Profile {
  return useSyncExternalStore(
    (cb) => {
      load();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => profile,
    () => EMPTY,
  );
}
