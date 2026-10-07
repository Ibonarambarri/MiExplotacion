"use client";

import { useState } from "react";

/**
 * Estado de un sheet de edición: conserva el elemento mientras se anima el
 * cierre (si se desmontara al cerrar, el sheet desaparecería de golpe).
 */
export function useSheet<T>() {
  const [item, setItem] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  return {
    item,
    open,
    show(next: T) {
      setItem(next);
      setOpen(true);
    },
    hide() {
      setOpen(false);
    },
    onOpenChange(v: boolean) {
      setOpen(v);
    },
  };
}
