import { notFound } from "next/navigation";
import { AnimalHero } from "@/components/animal/animal-hero";
import { AnimalKpiRow } from "@/components/animal/kpi-row";
import { DetailTabs } from "@/components/animal/detail-tabs";
import { parseDetailTab } from "@/components/animal/detail-tab-keys";
import { Timeline } from "@/components/animal/timeline";
import { HealthTab } from "@/components/animal/health-tab";
import { BreedingsTab } from "@/components/animal/breedings-tab";
import { WeightsPanel } from "@/components/animal/weights-panel";
import { DataTab } from "@/components/animal/data-tab";
import { ExpensesTab } from "@/components/animal/expenses-tab";
import { getSheepById, getSheepLabel, listSheepDaughters } from "@/lib/queries/sheep";
import { getRabbitById, getRabbitLabel, listRabbitDaughters } from "@/lib/queries/rabbits";
import {
  listSheepVaccines,
  listSheepDiseases,
  listSheepBreedings,
  listSheepTransactions,
} from "@/lib/queries/sheep-detail";
import {
  listRabbitVaccines,
  listRabbitDiseases,
  listRabbitBreedings,
  listRabbitTransactions,
} from "@/lib/queries/rabbit-detail";
import { getAnimalKpis } from "@/lib/queries/indicators";
import { listWeights } from "@/lib/queries/weights";
import { buildTimeline } from "@/lib/queries/timeline";
import { getSettings } from "@/lib/settings";
import { ageLabel } from "@/lib/dates";

/** Ficha completa de oveja o coneja. */
export async function AnimalDetailPage({
  kind,
  id,
  tab,
}: {
  kind: "oveja" | "coneja";
  id: string;
  tab?: string;
}) {
  const animalId = Number(id);
  if (!Number.isInteger(animalId) || animalId <= 0) notFound();
  const isSheep = kind === "oveja";
  const base = isSheep ? "/ovejas" : "/conejas";

  const animal = isSheep ? await getSheepById(animalId) : await getRabbitById(animalId);
  if (!animal) notFound();

  const [kpis, vaccines, diseases, txs, weights, daughters, mother, settings] = await Promise.all([
    getAnimalKpis(kind, animalId),
    isSheep ? listSheepVaccines(animalId) : listRabbitVaccines(animalId),
    isSheep ? listSheepDiseases(animalId) : listRabbitDiseases(animalId),
    isSheep ? listSheepTransactions(animalId) : listRabbitTransactions(animalId),
    listWeights({ kind: isSheep ? "sheep" : "rabbit", id: animalId }),
    isSheep ? listSheepDaughters(animalId) : listRabbitDaughters(animalId),
    animal.motherId
      ? isSheep
        ? getSheepLabel(animal.motherId)
        : getRabbitLabel(animal.motherId)
      : Promise.resolve(null),
    getSettings(),
  ]);

  const timelineBase = {
    animal: {
      id: animal.id,
      birthDate: animal.birthDate,
      status: animal.status,
      deathDate: animal.deathDate,
      deathCause: animal.deathCause,
    },
    vaccines,
    diseases,
    weights,
    transactions: txs,
  };

  let crias: React.ReactNode;
  let events;
  if (isSheep) {
    const breedings = await listSheepBreedings(animalId);
    events = buildTimeline({ ...timelineBase, kind: "oveja", breedings });
    crias = (
      <BreedingsTab
        kind="oveja"
        animalId={animalId}
        breedings={breedings}
        daughters={daughters}
        gestationDays={settings.sheepGestationDays}
      />
    );
  } else {
    const breedings = await listRabbitBreedings(animalId);
    events = buildTimeline({ ...timelineBase, kind: "coneja", breedings });
    crias = (
      <BreedingsTab
        kind="coneja"
        animalId={animalId}
        breedings={breedings}
        daughters={daughters}
        gestationDays={settings.rabbitGestationDays}
      />
    );
  }

  const name = animal.nickname || animal.tagId;
  const motherLink = mother ? { href: `${base}/${mother.id}`, label: mother.label } : null;
  const editHref = `${base}/${animalId}/editar`;

  return (
    <div>
      <AnimalHero
        kind={kind}
        id={animalId}
        name={name}
        tagId={animal.tagId}
        hasNickname={!!animal.nickname}
        photo={animal.photo}
        status={animal.status}
        age={animal.status === "activo" ? ageLabel(animal.birthDate) : null}
        mother={motherLink}
        back={{ href: base, label: isSheep ? "Ovejas" : "Conejas" }}
        editHref={editHref}
      />

      <AnimalKpiRow kind={kind} kpis={kpis} base={`${base}/${animalId}`} />

      <DetailTabs
        initial={parseDetailTab(tab)}
        panels={{
          resumen: <Timeline events={events} />,
          salud: (
            <HealthTab
              kind={kind}
              animalId={animalId}
              vaccines={vaccines}
              diseases={diseases}
              presets={settings.vaccinePresets}
            />
          ),
          crias,
          pesos: (
            <WeightsPanel target={{ kind: isSheep ? "sheep" : "rabbit", id: animalId }} points={weights} />
          ),
          datos: (
            <DataTab
              kind={kind}
              id={animalId}
              animal={{
                tagId: animal.tagId,
                nickname: animal.nickname,
                birthDate: animal.birthDate,
                status: animal.status,
                deathDate: animal.deathDate,
                deathCause: animal.deathCause,
                notes: animal.notes,
              }}
              tagLabel={isSheep ? "Crotal" : "Identificador"}
              mother={motherLink}
              editHref={editHref}
            />
          ),
          gastos: (
            <ExpensesTab
              transactions={txs}
              newHref={`/finanzas/nuevo?${isSheep ? "sheepId" : "rabbitId"}=${animalId}`}
            />
          ),
        }}
      />
    </div>
  );
}
