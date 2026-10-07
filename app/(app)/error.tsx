"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { CloudOff, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-warning-soft text-warning">
        <CloudOff className="h-8 w-8" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Algo no ha ido bien</h1>
      <p className="mt-2 max-w-xs text-pretty text-[15px] text-muted-foreground">
        No hemos podido cargar esta pantalla. Puede ser la conexión; tus datos
        están a salvo.
      </p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        <Button
          size="lg"
          disabled={isPending}
          onClick={() => startTransition(() => unstable_retry())}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <RotateCw className="h-5 w-5" aria-hidden />
          )}
          Reintentar
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/">Volver a Inicio</Link>
        </Button>
      </div>
      {error.digest && (
        <p className="tabular mt-6 text-xs text-muted-foreground/70">
          Código: {error.digest}
        </p>
      )}
    </div>
  );
}
