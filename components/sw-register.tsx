"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { attachInstallListeners } from "@/components/pwa/install-store";

/**
 * Registra el service worker (solo en producción), avisa cuando hay una
 * versión nueva esperando y muestra el banner "Sin conexión".
 * Se monta una vez en el layout raíz.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    attachInstallListeners();

    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }

    let refreshing = false;
    let userAccepted = false;
    const onControllerChange = () => {
      if (!userAccepted || refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const promptUpdate = (worker: ServiceWorker) => {
      toast("Nueva versión disponible", {
        id: "sw-update",
        duration: Infinity,
        action: {
          label: "Actualizar",
          onClick: () => {
            userAccepted = true;
            worker.postMessage({ type: "SKIP_WAITING" });
          },
        },
      });
    };

    let registration: ServiceWorkerRegistration | undefined;
    const onVisible = () => {
      if (document.visibilityState === "visible") registration?.update().catch(() => {});
    };

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
      } catch {
        return; // El SW es opcional: la app funciona sin él.
      }
      const reg = registration;
      // Solo hay "actualización" si ya había un SW controlando la página.
      if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            promptUpdate(installing);
          }
        });
      });
      document.addEventListener("visibilitychange", onVisible);
    };

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", () => void register(), { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <OfflineBanner />;
}
