import { AnimalListPage } from "@/components/animal/animal-list-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vacunar conejas en lote" };

/** Acceso directo (acciones rápidas): abre el listado en modo selección. */
export default function ConejasLotePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  return <AnimalListPage kind="coneja" searchParams={searchParams} batchMode />;
}
