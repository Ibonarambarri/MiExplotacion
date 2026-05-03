"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTab } from "@/components/animal/data-tab";
import { VaccinesTab } from "@/components/animal/vaccines-tab";
import { DiseasesTab } from "@/components/animal/diseases-tab";
import { RabbitBreedingsTab } from "@/components/animal/rabbit-breedings-tab";
import { ExpensesTab } from "@/components/animal/expenses-tab";
import {
  createRabbitVaccineAction,
  updateRabbitVaccineAction,
  deleteRabbitVaccineAction,
} from "@/actions/rabbit-vaccines";
import {
  createRabbitDiseaseAction,
  updateRabbitDiseaseAction,
  deleteRabbitDiseaseAction,
} from "@/actions/rabbit-diseases";
import { deleteRabbitAction } from "@/actions/rabbits";
import type {
  Rabbit,
  RabbitVaccine,
  RabbitDisease,
  Transaction,
} from "@/db/schema";
import type { BreedingWithLitter } from "@/lib/queries/rabbit-detail";

export function RabbitDetailTabs({
  rabbit,
  vaccines,
  diseases,
  breedings,
  transactions,
}: {
  rabbit: Rabbit;
  vaccines: RabbitVaccine[];
  diseases: RabbitDisease[];
  breedings: BreedingWithLitter[];
  transactions: Transaction[];
}) {
  const id = rabbit.id;
  const createVaccine = createRabbitVaccineAction.bind(null, id);
  const buildUpdateVaccine = (vaccineId: number) =>
    updateRabbitVaccineAction.bind(null, id, vaccineId);
  const buildDeleteVaccine = (vaccineId: number) => () =>
    deleteRabbitVaccineAction(id, vaccineId);

  const createDisease = createRabbitDiseaseAction.bind(null, id);
  const buildUpdateDisease = (dId: number) =>
    updateRabbitDiseaseAction.bind(null, id, dId);
  const buildDeleteDisease = (dId: number) => () =>
    deleteRabbitDiseaseAction(id, dId);

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
          animal={rabbit}
          editHref={`/conejas/${id}/editar`}
          onDelete={async () => {
            await deleteRabbitAction(id);
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
        <RabbitBreedingsTab rabbitId={id} breedings={breedings} />
      </TabsContent>

      <TabsContent value="gastos">
        <ExpensesTab
          transactions={transactions}
          newHref={`/finanzas/nuevo?rabbitId=${id}`}
        />
      </TabsContent>
    </Tabs>
  );
}
