"use client";

/**
 * Guarda el evento `beforeinstallprompt` (Android/Chrome) en cuanto llega,
 * aunque la página Más aún no esté montada. Lo engancha ServiceWorkerRegister.
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

let attached = false;
export function attachInstallListeners() {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
}

export function subscribeInstall(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getInstallSnapshot() {
  return deferred;
}

export function wasJustInstalled() {
  return installed;
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const ev = deferred;
  await ev.prompt();
  const choice = await ev.userChoice.catch(() => null);
  deferred = null;
  emit();
  return choice?.outcome === "accepted";
}

/** ¿Se está ejecutando como app instalada (pantalla de inicio)? */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS se presenta como Mac con pantalla táctil.
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)
  );
}
