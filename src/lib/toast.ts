"use client";

export interface ToastMsg {
  id: number;
  text: string;
}

type Listener = (t: ToastMsg) => void;
const listeners = new Set<Listener>();
let seq = 0;

/** Tampilkan notifikasi sukses singkat (dirender oleh <Toaster />). */
export function toastSuccess(text: string) {
  const t = { id: ++seq, text };
  listeners.forEach((l) => l(t));
}

export function onToast(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
