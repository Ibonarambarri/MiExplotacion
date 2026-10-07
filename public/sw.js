/* Service worker de Mi Explotación.
 *
 * Estrategias:
 *  - Navegaciones (HTML): red primero; si no hay red, la última copia guardada
 *    de esa página y, si no existe, /offline.
 *  - /_next/static e /icons: caché primero (los ficheros llevan hash/versión).
 *  - Nunca se cachean POST, server actions (cabecera Next-Action), /api ni
 *    peticiones RSC de navegación cliente: los datos del ganado siempre vienen
 *    de la red cuando la hay.
 *
 * Al cambiar este fichero, sube VERSION: se crea una caché nueva y las viejas
 * se borran en `activate`.
 */
const VERSION = "v2";
const PRECACHE = `mi-explotacion-precache-${VERSION}`;
const PAGES = `mi-explotacion-pages-${VERSION}`;
const STATIC = `mi-explotacion-static-${VERSION}`;
const KNOWN = [PRECACHE, PAGES, STATIC];

const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32.png",
];
const MAX_PAGES = 40;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) =>
      // Individualmente: si un recurso falla no se aborta la instalación.
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {}),
        ),
      ),
    ),
  );
  // No hacemos skipWaiting aquí: la app muestra "Nueva versión disponible" y
  // el usuario decide cuándo actualizar (mensaje SKIP_WAITING).
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => (k.startsWith("mi-explotacion-") || k.startsWith("acienda-")) && !KNOWN.includes(k))
          .map((k) => caches.delete(k)),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable().catch(() => {});
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  }
}

async function handleNavigation(event) {
  const { request } = event;
  try {
    const preload = await event.preloadResponse;
    const response = preload || (await fetch(request));
    // Solo guardamos páginas buenas y no redirigidas (p. ej. no el /login).
    if (response.ok && response.type === "basic" && !response.redirected) {
      const copy = response.clone();
      event.waitUntil(
        caches
          .open(PAGES)
          .then((cache) => cache.put(request.url.split("#")[0], copy))
          .then(() => trimCache(PAGES, MAX_PAGES)),
      );
    }
    return response;
  } catch {
    const cached = await caches.match(request.url.split("#")[0], {
      cacheName: PAGES,
    });
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL, { cacheName: PRECACHE });
    return (
      offline ||
      new Response("Sin conexión", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(event) {
  const { request } = event;
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const copy = response.clone();
    event.waitUntil(caches.open(STATIC).then((c) => c.put(request, copy)));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.headers.has("Next-Action")) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  // Peticiones RSC (navegación cliente / prefetch): siempre red.
  if (request.headers.has("RSC") || url.searchParams.has("_rsc")) return;

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(event));
  }
});

// ─── Notificaciones push ────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Mi Explotación";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/favicon-32.png",
    tag: data.tag || "mi-explotacion",
    renotify: Boolean(data.tag),
    lang: "es-ES",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    (event.notification.data && event.notification.data.url) || "/",
    self.location.origin,
  ).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if (client.url === target && "focus" in client) return client.focus();
      }
      const any = windows.find((c) => "focus" in c);
      if (any) {
        await any.focus();
        if ("navigate" in any) return any.navigate(target).catch(() => {});
        return;
      }
      return self.clients.openWindow(target);
    })(),
  );
});
