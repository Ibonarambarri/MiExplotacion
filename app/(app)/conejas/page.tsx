import { AnimalListPage } from "@/components/animal/animal-list-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conejas" };

export default function ConejasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  return <AnimalListPage kind="coneja" searchParams={searchParams} />;
}
