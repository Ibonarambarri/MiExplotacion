import { notFound } from "next/navigation";
import { BackLink } from "@/components/animal/back-link";
import { BreedingSummary } from "@/components/animal/breeding-summary";
import { getRabbitLabel } from "@/lib/queries/rabbits";
import { getRabbitBreeding } from "@/lib/queries/rabbit-detail";
import { listWeights } from "@/lib/queries/weights";
import { getGestationDays } from "@/lib/settings";
import { formatDateEs } from "@/lib/utils";
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
  if (!Number.isInteger(rabbitId) || !Number.isInteger(brId)) notFound();

  const [animal, breeding, gestationDays] = await Promise.all([
    getRabbitLabel(rabbitId),
    getRabbitBreeding(brId),
    getGestationDays("coneja"),
  ]);
  if (!animal || !breeding || breeding.rabbitId !== rabbitId) notFound();
  const weights = breeding.litter
    ? await listWeights({ kind: "litter", id: breeding.litter.id })
    : [];
  const backHref = `/conejas/${rabbitId}?tab=crias`;

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
        kind="coneja"
        animalId={rabbitId}
        breeding={breeding}
        gestationDays={gestationDays}
        backHref={backHref}
      />

      <LitterClient
        rabbitId={rabbitId}
        breeding={breeding}
        litter={breeding.litter}
        weights={weights}
      />
    </div>
  );
}
