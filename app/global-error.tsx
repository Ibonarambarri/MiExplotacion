"use client";

import "./globals.css";

/** Último recurso: falla el layout raíz. Debe pintar su propio <html>/<body>. */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground antialiased">
        <title>Error · Mi Explotación</title>
        <main role="alert" className="w-full max-w-xs text-center">
          <h1 className="text-2xl font-bold tracking-tight">Algo no ha ido bien</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            La aplicación no ha podido arrancar. Comprueba la conexión y vuelve a
            intentarlo.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="pressable mt-6 h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground"
          >
            Reintentar
          </button>
          {error.digest && (
            <p className="mt-6 text-xs text-muted-foreground">Código: {error.digest}</p>
          )}
        </main>
      </body>
    </html>
  );
}
