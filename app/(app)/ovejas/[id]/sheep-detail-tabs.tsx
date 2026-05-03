"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTab } from "@/components/animal/data-tab";
import { VaccinesTab } from "@/components/animal/vaccines-tab";
import { DiseasesTab } from "@/components/animal/diseases-tab";
import { SheepBreedingsTab } from "@/components/animal/sheep-breedings-tab";
import { ExpensesTab } from "@/components/animal/expenses-tab";
import {
  createSheepVaccineAction,
  updateSheepVaccineAction,
  deleteSheepVaccineAction,
} from "@/actions/sheep-vaccines";
import {
  createSheepDiseaseAction,
  updateSheepDiseaseAction,
  deleteSheepDiseaseAction,
} from "@/actions/sheep-diseases";
import { deleteSheepAction } from "@/actions/sheep";
import type {
  Sheep,
  SheepVaccine,
  SheepDisease,
  Transaction,
} from "@/db/schema";
import type { BreedingWithLambs } from "@/lib/queries/sheep-detail";

export function SheepDetailTabs({
  sheep,
  vaccines,
  diseases,
  breedings,
  transactions,
}: {
  sheep: Sheep;
  vaccines: SheepVaccine[];
  diseases: SheepDisease[];
  breedings: BreedingWithLambs[];
  transactions: Transaction[];
}) {
  const id = sheep.id;
  const createVaccine = createSheepVaccineAction.bind(null, id);
  const buildUpdateVaccine = (vaccineId: number) =>
    updateSheepVaccineAction.bind(null, id, vaccineId);
  const buildDeleteVaccine = (vaccineId: number) => () =>
    deleteSheepVaccineAction(id, vaccineId);

  const createDisease = createSheepDiseaseAction.bind(null, id);
  const buildUpdateDisease = (dId: number) =>
    updateSheepDiseaseAction.bind(null, id, dId);
  const buildDeleteDisease = (dId: number) => () =>
    deleteSheepDiseaseAction(id, dId);

  return (
    <Tabs defaultValue="datos">
      <TabsList>
        <TabsTrigger value="datos">Datos</TabsTrigger>
        <TabsTrigger value="vacunas">Vacunas</TabsTrigger>
        <TabsTrigger value="enfermedades">Salud</TabsTrigger>
        <TabsTrigger value="crianzas">Crianzas</TabsTrigger>
        <TabsTrigger value="gastos">Gastos</TabsTrigger>
      </TabsList>

      <TabsContent value="datos">
        <DataTab
          animal={sheep}
          editHref={`/ovejas/${id}/editar`}
          onDelete={async () => {
            await deleteSheepAction(id);
          }}
        />
      </TabsContent>

      <TabsContent value="vacunas">
        <VaccinesTab
          vaccines={vaccines}
          createAction={createVaccine}
          buildUpdateAction={buildUpdateVaccine}
          buildDeleteAction={buildDeleteVaccine}
        />
      </TabsContent>

      <TabsContent value="enfermedades">
        <DiseasesTab
          diseases={diseases}
          createAction={createDisease}
          buildUpdateAction={buildUpdateDisease}
          buildDeleteAction={buildDeleteDisease}
        />
      </TabsContent>

      <TabsContent value="crianzas">
        <SheepBreedingsTab sheepId={id} breedings={breedings} />
      </TabsContent>

      <TabsContent value="gastos">
        <ExpensesTab
          transactions={transactions}
          newHref={`/finanzas/nuevo?sheepId=${id}`}
        />
      </TabsContent>
    </Tabs>
  );
}
