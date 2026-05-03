import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/animal/status-badge";
import { Button } from "@/components/ui/button";
import { getRabbitById } from "@/lib/queries/rabbits";
import {
  listRabbitVaccines,
  listRabbitDiseases,
  listRabbitBreedings,
  listRabbitTransactions,
} from "@/lib/queries/rabbit-detail";
import { RabbitDetailTabs } from "./rabbit-detail-tabs";

export const dynamic = "force-dynamic";

export default async function ConejaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rabbitId = Number(id);
  if (!Number.isFinite(rabbitId)) notFound();

  const animal = await getRabbitById(rabbitId);
  if (!animal) notFound();

  const [vaccines, diseases, breedings, txs] = await Promise.all([
    listRabbitVaccines(rabbitId),
    listRabbitDiseases(rabbitId),
    listRabbitBreedings(rabbitId),
    listRabbitTransactions(rabbitId),
  ]);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 h-8 px-2">
        <Link href="/conejas">
          <ChevronLeft className="h-4 w-4" />
          Conejas
        </Link>
      </Button>

      <PageHeader
        title={animal.nickname || animal.tagId}
        description={
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs">{animal.tagId}</span>
            <StatusBadge status={animal.status} />
          </span>
        }
      />

      <RabbitDetailTabs
        rabbit={animal}
        vaccines={vaccines}
        diseases={diseases}
        breedings={breedings}
        transactions={txs}
      />
    </div>
  );
}
