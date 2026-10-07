import {
  HeaderSkeleton,
  ListSkeleton,
  LoadingRoot,
} from "@/components/page-skeletons";

/** Más: grupos de ajustes. */
export default function Loading() {
  return (
    <LoadingRoot>
      <HeaderSkeleton />
      <ListSkeleton rows={3} trailing={false} />
      <ListSkeleton rows={4} trailing={false} />
      <ListSkeleton rows={1} title={false} trailing={false} />
    </LoadingRoot>
  );
}
