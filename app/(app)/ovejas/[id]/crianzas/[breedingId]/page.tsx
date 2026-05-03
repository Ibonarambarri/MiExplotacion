import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { getSheepById } from "@/lib/queries/sheep";
import { getSheepBreeding } from "@/lib/queries/sheep-detail";
import { BreedingClient } from "./breeding-client";

export const dynamic = "force-dynamic";

export default async function CrianzaPage({
  params,
}: {
  params: Promise<{ id: string; breedingId: string }>;
}) {
  const { id, breedingId } = await params;
  const sheepId = Number(id);
  const brId = Number(breedingId);
  if (!Number.isFinite(sheepId) || !Number.isFinite(brId)) notFound();

  const [animal, breeding] = await Promise.all([
    getSheepById(sheepId),
    getSheepBreeding(brId),
  ]);
  if (!animal || !breeding || breeding.sheepId !== sheepId) notFound();

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 h-8 px-2">
        <Link href={`/ovejas/${sheepId}`}>
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

      <BreedingClient
        sheepId={sheepId}
        breeding={breeding}
        lambs={breeding.lambs}
      />
    </div>
  );
}
