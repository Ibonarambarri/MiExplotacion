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
import { SHEEP_GESTATION_DAYS } from "@/lib/dates";
import { createSheepBreedingAction } from "@/actions/sheep-breedings";
import type { BreedingWithLambs } from "@/lib/queries/sheep-detail";

export function SheepBreedingsTab({
  sheepId,
  breedings,
}: {
  sheepId: number;
  breedings: BreedingWithLambs[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const createAction = createSheepBreedingAction.bind(null, sheepId);

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
          description="Registra una inseminación. La fecha de parto se calculará automáticamente (+150 días)."
        />
      ) : (
        <div className="grid gap-2">
          {breedings.map((b) => {
            const aliveLambs = b.lambs.filter((l) => l.status === "vivo").length;
            const totalLambs = b.lambs.length;
            const isPending = !b.actualBirthDate;
            return (
              <Card key={b.id}>
                <Link
                  href={`/ovejas/${sheepId}/crianzas/${b.id}`}
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
                        Inseminación: {formatDateEs(b.inseminationDate)} · Esperado:{" "}
                        {formatDateEs(b.expectedBirthDate)}
                      </div>
                      {totalLambs > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {totalLambs} corderos · {aliveLambs} vivos
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
        gestationDays={SHEEP_GESTATION_DAYS}
      />
    </div>
  );
}
