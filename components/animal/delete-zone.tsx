"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Botón "Eliminar" dentro de un sheet con confirmación en línea (dos toques),
 * para no apilar otro sheet encima.
 */
export function DeleteZone({
  label = "Eliminar",
  confirmText = "¿Seguro? Esta acción se puede deshacer unos segundos.",
  onDelete,
  className,
}: {
  label?: string;
  confirmText?: string;
  onDelete: () => Promise<void>;
  className?: string;
}) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!asking) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={cn("w-full text-destructive hover:text-destructive", className)}
        onClick={() => setAsking(true)}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {label}
      </Button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label="Confirmar eliminación"
      className={cn(
        "space-y-2 rounded-xl bg-danger-soft p-3 animate-in fade-in-0 zoom-in-95 duration-150",
        className,
      )}
    >
      <p className="text-sm text-destructive">{confirmText}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setAsking(false)}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={() => startTransition(onDelete)}
        >
          {pending ? "Eliminando…" : "Sí, eliminar"}
        </Button>
      </div>
    </div>
  );
}
