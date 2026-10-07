"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";

/**
 * Cierra sesión y borra las páginas guardadas por el service worker para que
 * los datos de la explotación no queden accesibles sin conexión.
 */
export function LogoutButton() {
  async function clearPageCache() {
    try {
      if (!("caches" in window)) return;
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("mi-explotacion-pages-")).map((k) => caches.delete(k)),
      );
    } catch {
      // Sin caché disponible: nada que limpiar.
    }
  }

  return (
    <form
      action={async () => {
        await clearPageCache();
        await logoutAction();
      }}
    >
      <button
        type="submit"
        className="pressable flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card text-[15px] font-semibold text-destructive shadow-[0_1px_2px_rgb(0_0_0/0.04)] active:bg-accent/70"
      >
        <LogOut className="h-[18px] w-[18px]" aria-hidden />
        Cerrar sesión
      </button>
    </form>
  );
}
