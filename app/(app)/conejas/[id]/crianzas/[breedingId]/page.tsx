import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { getRabbitById } from "@/lib/queries/rabbits";
import { getRabbitBreeding } from "@/lib/queries/rabbit-detail";
import { LitterClient } from "./litter-client";

export const dynamic = "force-dynamic";

export default async function CrianzaConejaPage({
  params,
}: {
  params: Promise<{ id: string; breedingId: string }>;
}) {
  const { id, breedingId } = await params;
  const rabbitId = Number(id);
  const brId = Number(breedingId);
  if (!Number.isFinite(rabbitId) || !Number.isFinite(brId)) notFound();

  const [animal, breeding] = await Promise.all([
    getRabbitById(rabbitId),
    getRabbitBreeding(brId),
  ]);
  if (!animal || !breeding || breeding.rabbitId !== rabbitId) notFound();

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 h-8 px-2">
        <Link href={`/conejas/${rabbitId}`}>
          <ChevronLeft className="h-4 w-4" />
          {animal.nickname || animal.tagId}
        </Link>
      </Button>

      <PageHeader
        title="Crianza"
        description={
          breeding.actualBirthDate ? "Parida" : "Pendiente de parto"
        }
      />

      <LitterClient
        rabbitId={rabbitId}
        breeding={breeding}
        litter={breeding.litter}
      />
    </div>
  );
}
