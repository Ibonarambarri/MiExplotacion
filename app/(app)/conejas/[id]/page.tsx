import { AnimalDetailPage } from "@/components/animal/animal-detail-page";

export const dynamic = "force-dynamic";

export default async function ConejaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  return <AnimalDetailPage kind="coneja" id={id} tab={tab} />;
}
