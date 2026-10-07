"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** Pastilla fija arriba cuando no hay conexión. */
export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4",
        "pt-[calc(env(safe-area-inset-top,0px)+8px)]",
      )}
    >
      <div
        aria-hidden={online}
        className={cn(
          "flex items-center gap-2 rounded-full bg-foreground px-3.5 py-2 text-[13px] font-medium text-background shadow-lg",
          "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          online ? "-translate-y-[150%] opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
        <span>Sin conexión — mostrando datos guardados</span>
      </div>
    </div>
  );
}
