import { notFound } from "next/navigation";
import { BackLink } from "@/components/animal/back-link";
import { BreedingSummary } from "@/components/animal/breeding-summary";
import { getSheepLabel } from "@/lib/queries/sheep";
import { getSheepBreeding } from "@/lib/queries/sheep-detail";
import { listLambWeights } from "@/lib/queries/weights";
import { getGestationDays } from "@/lib/settings";
import { formatDateEs } from "@/lib/utils";
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
  if (!Number.isInteger(sheepId) || !Number.isInteger(brId)) notFound();

  const [animal, breeding, gestationDays] = await Promise.all([
    getSheepLabel(sheepId),
    getSheepBreeding(brId),
    getGestationDays("oveja"),
  ]);
  if (!animal || !breeding || breeding.sheepId !== sheepId) notFound();
  const lambWeights = await listLambWeights(breeding.lambs.map((l) => l.id));
  const backHref = `/ovejas/${sheepId}?tab=crias`;

  return (
    <div className="space-y-6">
      <div>
        <BackLink href={backHref} label={animal.label} />
        <h1 className="text-2xl font-semibold tracking-tight">
          {breeding.actualBirthDate
            ? `Parto del ${formatDateEs(breeding.actualBirthDate)}`
            : "Crianza en curso"}
        </h1>
      </div>

      <BreedingSummary
        kind="oveja"
        animalId={sheepId}
        breeding={breeding}
        gestationDays={gestationDays}
        backHref={backHref}
      />

      <BreedingClient
        sheepId={sheepId}
        motherName={animal.label}
        breeding={breeding}
        lambs={breeding.lambs}
        lambWeights={lambWeights}
      />
    </div>
  );
}
