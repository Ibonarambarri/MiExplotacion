import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 404 para rutas que no existen (fuera del layout con barra inferior). */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
        <SearchX className="h-8 w-8" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Página no encontrada</h1>
      <p className="mt-2 max-w-xs text-pretty text-[15px] text-muted-foreground">
        Esta dirección no existe en Mi Explotación.
      </p>
      <Button asChild size="lg" className="mt-6 w-full max-w-xs">
        <Link href="/">Ir a Inicio</Link>
      </Button>
    </main>
  );
}
