"use client";
import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { usePhotoUrl } from "@/lib/photos";
import { btnGhostCls } from "./ui";

function Thumb({ id, onOpen }: { id: string; onOpen: (url: string) => void }) {
  const url = usePhotoUrl(id);
  if (!url) return <div className="size-16 animate-pulse rounded-xl bg-fg/5" />;
  return (
    <button type="button" onClick={() => onOpen(url)} className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="size-16 rounded-xl border border-line object-cover" />
    </button>
  );
}

/** Deretan thumbnail foto tersimpan; klik untuk memperbesar. */
export function PhotoStrip({ label, ids }: { label: string; ids?: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!ids?.length) return null;
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {ids.map((id) => (
          <Thumb key={id} id={id} onOpen={setOpen} />
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
          <button aria-label="Tutup" className="absolute right-4 top-4 rounded-full bg-card p-2" onClick={() => setOpen(null)}>
            <X className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}

const previewUrls = new WeakMap<File, string>();
function previewUrl(f: File) {
  let u = previewUrls.get(f);
  if (!u) previewUrls.set(f, (u = URL.createObjectURL(f)));
  return u;
}

/** Pemilih foto (belum disimpan): kamera/galeri, dengan pratinjau dan tombol hapus. */
export function PhotoPicker({ label, files, onChange }: { label: string; files: File[]; onChange: (f: File[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => onChange([...files, ...Array.from(e.target.files ?? [])])} />
      <div className="flex flex-wrap items-center gap-2">
        {files.map((file, i) => (
          <div key={previewUrl(file)} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl(file)} alt="" className="size-16 rounded-xl border border-line object-cover" />
            <button
              type="button"
              aria-label="Hapus foto"
              onClick={() => {
                URL.revokeObjectURL(previewUrl(file));
                previewUrls.delete(file);
                onChange(files.filter((_, j) => j !== i));
              }}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-card p-0.5 ring-1 ring-line"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <button type="button" className={btnGhostCls + " !px-4 !py-2"} onClick={() => ref.current?.click()}>
          <Camera className="size-4" /> Tambah foto
        </button>
      </div>
    </div>
  );
}
