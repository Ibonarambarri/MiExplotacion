import { AnimalListPage } from "@/components/animal/animal-list-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vacunar ovejas en lote" };

/** Acceso directo (acciones rápidas): abre el listado en modo selección. */
export default function OvejasLotePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  return <AnimalListPage kind="oveja" searchParams={searchParams} batchMode />;
}
