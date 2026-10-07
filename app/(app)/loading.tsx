import { Skeleton } from "@/components/ui/skeleton";
import {
  CardSkeleton,
  ListSkeleton,
  LoadingRoot,
} from "@/components/page-skeletons";

/** Inicio: saludo, tarjeta "Hoy", bento y listas. */
export default function Loading() {
  return (
    <LoadingRoot>
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
      <div className="space-y-3 rounded-3xl border border-border/60 bg-card p-4">
        <Skeleton className="h-5 w-12 rounded-md" />
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CardSkeleton />
        <CardSkeleton />
        <div className="col-span-2 flex items-center justify-between rounded-3xl border border-border/60 bg-card p-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-7 w-32 rounded-md" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
          <Skeleton className="h-16 w-[120px] rounded-lg" />
        </div>
      </div>
      <ListSkeleton rows={3} />
      <ListSkeleton rows={2} />
    </LoadingRoot>
  );
}
