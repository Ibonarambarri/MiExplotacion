// Minimal service worker — habilita "Añadir a pantalla de inicio" en móvil.
// No cachea respuestas dinámicas para evitar servir datos obsoletos del ganado.
const VERSION = "acienda-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pasa la red por defecto.
});
