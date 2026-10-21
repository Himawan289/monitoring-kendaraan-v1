"use client";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Field, btnCls, btnGhostCls, inputCls } from "@/components/ui";
import { TypePicker } from "@/components/type-picker";
import { useConfirm } from "@/components/confirm-dialog";
import { usePresence } from "@/lib/presence";
import { addVehicle } from "@/lib/store";
import type { VehicleType } from "@/lib/types";

function Form({ onClose, state }: { onClose: () => void; state: "open" | "closed" }) {
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [type, setType] = useState<VehicleType>("motor");
  const nameRef = useRef<HTMLInputElement>(null);
  const { ask, dialog } = useConfirm();

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    ask({
      rows: [["Jenis", type === "mobil" ? "Mobil" : "Motor"], ["Nama", name.trim()], ["Plat nomor", plate.trim().toUpperCase()]],
      confirmLabel: "Ya, tambahkan",
      run: () => {
        addVehicle(name.trim(), type, plate.trim().toUpperCase());
        onClose();
      },
    });
  }

  return (
    <div data-state={state} className="anim-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <form
        data-state={state}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-vehicle-title"
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        className="anim-modal w-full max-w-sm space-y-4 rounded-3xl border border-line bg-card p-6 shadow-2xl shadow-shade"
      >
        <h2 id="add-vehicle-title" className="text-lg font-semibold tracking-tight">Tambah kendaraan</h2>
        <Field label="Jenis kendaraan"><TypePicker value={type} onChange={setType} /></Field>
        <Field label="Nama kendaraan"><input ref={nameRef} required className={inputCls} placeholder="mis. Honda Beat" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Plat nomor (opsional)"><input className={inputCls} placeholder="mis. B 1234 ABC" maxLength={12} value={plate} onChange={(e) => setPlate(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button type="button" className={btnGhostCls} onClick={onClose}>Batal</button>
          <button className={btnCls}><Plus className="size-4" /> Tambah</button>
        </div>
      </form>
      {dialog}
    </div>
  );
}

/** Dialog tambah kendaraan; kendaraan baru langsung menjadi yang aktif. */
export function AddVehicleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mounted, state } = usePresence(open);
  return mounted ? <Form onClose={onClose} state={state} /> : null;
}
