import { Skeleton } from "@/components/ui/skeleton";
import {
  ChipsSkeleton,
  HeaderSkeleton,
  ListSkeleton,
  LoadingRoot,
} from "@/components/page-skeletons";

/** Finanzas: balance, gráfico mensual, filtros y movimientos. */
export default function Loading() {
  return (
    <LoadingRoot>
      <HeaderSkeleton />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2 rounded-2xl border border-border/60 bg-card p-4">
            <Skeleton className="h-3.5 w-16 rounded" />
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <Skeleton className="h-4 w-32 rounded-md" />
        <div className="mt-4 flex h-32 items-end gap-2">
          {[40, 65, 30, 80, 55, 70, 45, 90, 60, 35, 75, 50].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <ChipsSkeleton />
      <ListSkeleton rows={6} />
    </LoadingRoot>
  );
}
