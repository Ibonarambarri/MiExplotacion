"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Baby, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { BreedingFormDialog } from "@/components/animal/breeding-form-dialog";
import { formatDateEs } from "@/lib/utils";
import { RABBIT_GESTATION_DAYS } from "@/lib/dates";
import { createRabbitBreedingAction } from "@/actions/rabbit-breedings";
import type { BreedingWithLitter } from "@/lib/queries/rabbit-detail";

export function RabbitBreedingsTab({
  rabbitId,
  breedings,
}: {
  rabbitId: number;
  breedings: BreedingWithLitter[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const createAction = createRabbitBreedingAction.bind(null, rabbitId);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Crianza
        </Button>
      </div>

      {breedings.length === 0 ? (
        <EmptyState
          icon={<Baby className="h-6 w-6" />}
          title="Sin crianzas"
          description="Registra una cubrición. La fecha de parto se calculará automáticamente (+31 días)."
        />
      ) : (
        <div className="grid gap-2">
          {breedings.map((b) => {
            const isPending = !b.actualBirthDate;
            return (
              <Card key={b.id}>
                <Link
                  href={`/conejas/${rabbitId}/crianzas/${b.id}`}
                  className="block hover:bg-accent/50"
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {b.actualBirthDate
                            ? `Parto ${formatDateEs(b.actualBirthDate)}`
                            : "Crianza en curso"}
                        </span>
                        {isPending ? (
                          <Badge variant="warning">Pendiente</Badge>
                        ) : (
                          <Badge variant="success">Parida</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cubrición: {formatDateEs(b.inseminationDate)} · Esperado:{" "}
                        {formatDateEs(b.expectedBirthDate)}
                      </div>
                      {b.litter && (
                        <div className="text-xs text-muted-foreground">
                          Camada: {b.litter.currentUnits}/{b.litter.initialUnits}{" "}
                          vivos · {b.litter.naturalDeaths} bajas
                        </div>
                      )}
                    </div>
                    <ChevronRight
                      className="h-5 w-5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      <BreedingFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        action={createAction}
        title="Nueva crianza"
        gestationDays={RABBIT_GESTATION_DAYS}
      />
    </div>
  );
}
