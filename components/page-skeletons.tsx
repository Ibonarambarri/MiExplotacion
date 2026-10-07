import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Piezas de esqueleto para los loading.tsx. Reproducen la geometría de las
 * pantallas (cabecera grande, listas agrupadas, tarjetas) para que el cambio
 * a contenido real no salte.
 */

export function LoadingRoot({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-5">
      <span className="sr-only">Cargando…</span>
      {children}
    </div>
  );
}

export function HeaderSkeleton({
  back,
  description = true,
  action,
}: {
  back?: boolean;
  description?: boolean;
  action?: boolean;
}) {
  return (
    <div className="pb-0">
      {back && <Skeleton className="mb-3 h-5 w-20 rounded-md" />}
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 rounded-lg" />
          {description && <Skeleton className="h-4 w-56 rounded-md" />}
        </div>
        {action && <Skeleton className="h-11 w-11 rounded-full" />}
      </div>
    </div>
  );
}

export function ListSkeleton({
  rows = 5,
  title = true,
  avatar = "square",
  trailing = true,
  className,
}: {
  rows?: number;
  title?: boolean;
  avatar?: "square" | "round" | false;
  trailing?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {title && <Skeleton className="ml-1 h-3.5 w-28 rounded" />}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-14 items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0"
          >
            {avatar && (
              <Skeleton
                className={cn(
                  "h-9 w-9 shrink-0",
                  avatar === "round" ? "h-10 w-10 rounded-full" : "rounded-xl",
                )}
              />
            )}
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 rounded-md" style={{ width: `${55 + ((i * 17) % 30)}%` }} />
              <Skeleton className="h-3 w-1/3 rounded-md" />
            </div>
            {trailing && <Skeleton className="h-5 w-12 rounded-full" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChipsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 shrink-0 rounded-full" style={{ width: 64 + (i % 3) * 16 }} />
      ))}
    </div>
  );
}

export function SearchSkeleton() {
  return <Skeleton className="h-11 w-full rounded-xl" />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-border/60 bg-card p-4", className)}>
      <Skeleton className="h-9 w-9 rounded-xl" />
      <Skeleton className="mt-4 h-7 w-16 rounded-md" />
      <Skeleton className="mt-2 h-3.5 w-24 rounded-md" />
    </div>
  );
}

/** Listado de animales (ovejas / conejas). */
export function AnimalListSkeleton() {
  return (
    <LoadingRoot>
      <HeaderSkeleton />
      <SearchSkeleton />
      <ChipsSkeleton />
      <ListSkeleton rows={7} title={false} avatar="round" />
    </LoadingRoot>
  );
}

/** Ficha de un animal: cabecera con avatar, KPIs, pestañas y lista. */
export function AnimalDetailSkeleton() {
  return (
    <LoadingRoot>
      <Skeleton className="h-5 w-20 rounded-md" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border/60 bg-card p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-6 w-10 rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
      <ListSkeleton rows={4} />
    </LoadingRoot>
  );
}

/** Crianza / camada: cabecera, resumen y lista de crías. */
export function BreedingSkeleton() {
  return (
    <LoadingRoot>
      <HeaderSkeleton back />
      <div className="grid grid-cols-2 gap-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <ListSkeleton rows={3} />
      <ListSkeleton rows={4} avatar="round" />
    </LoadingRoot>
  );
}

/** Formulario (alta / edición). */
export function FormSkeleton() {
  return (
    <LoadingRoot>
      <HeaderSkeleton back description={false} />
      {[0, 1].map((g) => (
        <div key={g} className="space-y-4 rounded-2xl border border-border/60 bg-card p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-xl" />
    </LoadingRoot>
  );
}
