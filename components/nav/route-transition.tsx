"use client";

import type {} from "react/canary";
import { ViewTransition } from "react";
import { usePathname } from "next/navigation";

/**
 * Fundido corto entre pantallas usando <ViewTransition> de React
 * (experimental.viewTransition en next.config.ts). Se identifica por ruta para
 * que los cambios de filtros en la misma pantalla (searchParams) no animen.
 * Las clases .vt-page-* se definen en app/(app)/layout.tsx.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition
      key={pathname}
      enter="vt-page-enter"
      exit="vt-page-exit"
      update="none"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
