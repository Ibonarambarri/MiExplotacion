"use client";

import { useSyncExternalStore } from "react";
import { Download, Share, SquarePlus, EllipsisVertical, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getInstallSnapshot,
  isIos,
  isStandalone,
  promptInstall,
  subscribeInstall,
  wasJustInstalled,
} from "@/components/pwa/install-store";

const noop = () => () => {};

/** Instrucciones para instalar la app; en Android usa el aviso nativo. */
export function InstallPrompt() {
  const deferred = useSyncExternalStore(subscribeInstall, getInstallSnapshot, () => null);
  const installed = useSyncExternalStore(
    subscribeInstall,
    () => isStandalone() || wasJustInstalled(),
    () => false,
  );
  const ios = useSyncExternalStore(noop, isIos, () => false);

  if (installed) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CircleCheck className="h-4 w-4 text-success" aria-hidden />
        Mi Explotación ya está instalada en este dispositivo.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {deferred && (
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => void promptInstall()}
        >
          <Download className="h-5 w-5" aria-hidden />
          Instalar Mi Explotación
        </Button>
      )}

      <Steps
        title="iPhone / iPad (Safari)"
        highlight={ios}
        steps={[
          <>
            Pulsa <Share className="inline h-4 w-4 align-[-2px]" aria-label="Compartir" />{" "}
            <strong>Compartir</strong> en la barra de Safari.
          </>,
          <>
            Elige <SquarePlus className="inline h-4 w-4 align-[-2px]" aria-hidden />{" "}
            <strong>Añadir a pantalla de inicio</strong>.
          </>,
          <>Pulsa <strong>Añadir</strong>. Abre Mi Explotación desde el nuevo icono.</>,
        ]}
      />
      <Steps
        title="Android (Chrome)"
        highlight={!ios}
        steps={[
          deferred ? (
            <>Pulsa el botón <strong>Instalar Mi Explotación</strong> de arriba.</>
          ) : (
            <>
              Abre el menú{" "}
              <EllipsisVertical className="inline h-4 w-4 align-[-2px]" aria-label="Menú" />{" "}
              de Chrome.
            </>
          ),
          <>
            Elige <strong>Instalar aplicación</strong> o{" "}
            <strong>Añadir a pantalla de inicio</strong>.
          </>,
        ]}
      />
    </div>
  );
}

function Steps({
  title,
  steps,
  highlight,
}: {
  title: string;
  steps: React.ReactNode[];
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-xl border border-primary/30 bg-primary/5 p-3"
          : "rounded-xl border border-border/60 p-3"
      }
    >
      <p className="mb-2 font-semibold">{title}</p>
      <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
