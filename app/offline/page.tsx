import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { RetryButton } from "@/components/pwa/retry-button";

export const metadata: Metadata = { title: "Sin conexión" };

/**
 * Página de reserva que el service worker precarga y sirve cuando no hay red
 * y la página pedida no se había visitado antes. No lee datos ni sesión.
 */
export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center">
      <div className="w-full max-w-xs space-y-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon.svg"
          alt=""
          width={72}
          height={72}
          className="mx-auto h-18 w-18"
        />
        <div className="space-y-2">
          <h1 className="flex items-center justify-center gap-2 text-xl font-semibold tracking-tight">
            <WifiOff className="h-5 w-5 text-muted-foreground" aria-hidden />
            Sin conexión
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Esta pantalla no estaba guardada en el teléfono. Las que ya hayas abierto
            antes se pueden consultar sin cobertura.
          </p>
        </div>
        <RetryButton />
      </div>
    </main>
  );
}
