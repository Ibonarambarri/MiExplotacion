"use client";

import { toast } from "sonner";

type Result = { ok: boolean; error?: string } | void;

/** Toast de borrado con acción "Deshacer" que re-crea el registro. */
export function toastWithUndo(message: string, undo: () => Promise<Result>) {
  toast(message, {
    duration: 6000,
    action: {
      label: "Deshacer",
      onClick: async () => {
        const r = await undo();
        if (r && !r.ok) toast.error(r.error ?? "No se pudo deshacer");
        else toast.success("Restaurado");
      },
    },
  });
}

/** Aviso tras una venta automática enlazada con Finanzas. */
export function toastSale(sale: "created" | "updated" | "removed" | null | undefined) {
  if (sale === "created") toast.success("Ingreso añadido a Finanzas");
  else if (sale === "updated") toast.success("Ingreso actualizado en Finanzas");
  else if (sale === "removed") toast("Ingreso quitado de Finanzas");
}
