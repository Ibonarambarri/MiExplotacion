import { AnimalListPage } from "@/components/animal/animal-list-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ovejas" };

export default function OvejasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  return <AnimalListPage kind="oveja" searchParams={searchParams} />;
}
