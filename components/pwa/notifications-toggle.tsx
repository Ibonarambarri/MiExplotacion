"use client";

import { useEffect, useState, useTransition } from "react";
import { BellRing, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendTestPush, subscribePush, unsubscribePush } from "@/actions/push";
import { isIos, isStandalone } from "@/components/pwa/install-store";

type Status =
  | "loading"
  | "unconfigured" // falta NEXT_PUBLIC_VAPID_PUBLIC_KEY
  | "ios-install" // iOS: solo funciona instalada en pantalla de inicio
  | "unsupported"
  | "no-sw" // sin service worker (p. ej. en desarrollo)
  | "denied"
  | "off"
  | "on";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration("/")) ?? null;
}

async function detect(): Promise<Status> {
  if (!VAPID_PUBLIC_KEY) return "unconfigured";
  const supported =
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return isIos() && !isStandalone() ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await getRegistration();
  if (!reg) return "no-sw";
  const sub = await reg.pushManager.getSubscription();
  return sub ? "on" : "off";
}

/**
 * Interruptor de notificaciones push: pide permiso, se suscribe con la clave
 * VAPID pública y guarda la suscripción en el servidor.
 */
export function NotificationsToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [testing, startTest] = useTransition();

  useEffect(() => {
    let alive = true;
    detect()
      .then((s) => alive && setStatus(s))
      .catch(() => alive && setStatus("unsupported"));
    return () => {
      alive = false;
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = (await getRegistration()) ?? (await navigator.serviceWorker.ready);
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      const res = await subscribePush(sub.toJSON(), navigator.userAgent);
      if (!res.ok) {
        await sub.unsubscribe().catch(() => {});
        toast.error(res.error);
        return;
      }
      setStatus("on");
      toast.success("Notificaciones activadas");
    } catch {
      toast.error("No se pudieron activar las notificaciones.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      toast.error("No se pudieron desactivar las notificaciones.");
    } finally {
      setBusy(false);
    }
  }

  function sendTest() {
    startTest(async () => {
      const res = await sendTestPush();
      if (res.ok) toast.success(res.message ?? "Notificación enviada.");
      else toast.error(res.error);
    });
  }

  const on = status === "on";
  const canToggle = status === "on" || status === "off";

  return (
    <div className="space-y-3">
      <div className="flex min-h-11 items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium">Resumen diario</p>
          <p className="text-[13px] text-muted-foreground">
            Vacunas, partos y tratamientos pendientes, cada mañana.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Activar notificaciones"
          disabled={!canToggle || busy}
          onClick={() => void (on ? disable() : enable())}
          className={cn(
            "pressable relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full p-[2px] transition-colors duration-200",
            "before:absolute before:-inset-2 before:content-['']", // zona táctil ≥ 44px
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:opacity-50",
            on ? "bg-success" : "bg-muted-foreground/25",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "flex h-[27px] w-[27px] items-center justify-center rounded-full bg-white shadow-[0_2px_4px_rgb(0_0_0/0.2)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
              on ? "translate-x-5" : "translate-x-0",
            )}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </span>
        </button>
      </div>

      <Hint status={status} />

      {on && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={sendTest}
          disabled={testing}
        >
          {testing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
          Enviar prueba
        </Button>
      )}
    </div>
  );
}

function Hint({ status }: { status: Status }) {
  const text: Partial<Record<Status, string>> = {
    unconfigured:
      "Las notificaciones aún no están configuradas en el servidor (faltan las claves VAPID).",
    "ios-install":
      "En iPhone y iPad primero hay que instalar Mi Explotación en la pantalla de inicio (ver «Instalar app») y abrirla desde ese icono.",
    unsupported: "Este navegador no admite notificaciones.",
    "no-sw":
      "Recarga la página para terminar de preparar la app y vuelve a intentarlo.",
    denied:
      "Has bloqueado las notificaciones. Actívalas en los ajustes del navegador o del teléfono para Mi Explotación.",
    off: isIosClient()
      ? "Al activarlas, el teléfono te pedirá permiso. En iPhone solo funcionan con la app instalada."
      : "Al activarlas, el teléfono te pedirá permiso.",
  };
  const t = text[status];
  if (!t) return null;
  return (
    <p className="flex gap-2 text-[13px] leading-snug text-muted-foreground">
      <BellRing className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{t}</span>
    </p>
  );
}

function isIosClient() {
  return typeof navigator !== "undefined" && isIos();
}
