import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/animal/status-badge";
import { Button } from "@/components/ui/button";
import { getSheepById } from "@/lib/queries/sheep";
import {
  listSheepVaccines,
  listSheepDiseases,
  listSheepBreedings,
  listSheepTransactions,
} from "@/lib/queries/sheep-detail";
import { SheepDetailTabs } from "./sheep-detail-tabs";

export const dynamic = "force-dynamic";

export default async function OvejaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sheepId = Number(id);
  if (!Number.isFinite(sheepId)) notFound();

  const animal = await getSheepById(sheepId);
  if (!animal) notFound();

  const [vaccines, diseases, breedings, txs] = await Promise.all([
    listSheepVaccines(sheepId),
    listSheepDiseases(sheepId),
    listSheepBreedings(sheepId),
    listSheepTransactions(sheepId),
  ]);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 h-8 px-2">
        <Link href="/ovejas">
          <ChevronLeft className="h-4 w-4" />
          Ovejas
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

      <SheepDetailTabs
        sheep={animal}
        vaccines={vaccines}
        diseases={diseases}
        breedings={breedings}
        transactions={txs}
      />
    </div>
  );
}
