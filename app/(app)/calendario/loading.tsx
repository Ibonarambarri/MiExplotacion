import { Skeleton } from "@/components/ui/skeleton";
import {
  HeaderSkeleton,
  ListSkeleton,
  LoadingRoot,
} from "@/components/page-skeletons";

/** Calendario: selector Mes/Agenda, rejilla del mes y lista del día. */
export default function Loading() {
  return (
    <LoadingRoot>
      <HeaderSkeleton back description={false} />
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="rounded-3xl border border-border/60 bg-card p-3">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="flex h-12 justify-center pt-0.5">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <ListSkeleton rows={2} />
    </LoadingRoot>
  );
}
