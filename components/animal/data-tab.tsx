"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/animal/status-badge";
import { formatDateEs } from "@/lib/utils";
import type { Sheep, Rabbit } from "@/db/schema";

export function DataTab({
  animal,
  editHref,
  onDelete,
}: {
  animal: Sheep | Rabbit;
  editHref: string;
  onDelete: () => Promise<{ ok: boolean; error?: string } | void>;
}) {
  const [askDelete, setAskDelete] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="grid gap-3 p-4 text-sm">
          <Row label="Crotal">
            <span className="font-mono">{animal.tagId}</span>
          </Row>
          <Row label="Apodo">{animal.nickname || "—"}</Row>
          <Row label="Nacimiento">
            {animal.birthDate ? formatDateEs(animal.birthDate) : "—"}
          </Row>
          <Row label="Estado">
            <StatusBadge status={animal.status} />
          </Row>
          {animal.deathDate && (
            <Row label="Fecha de baja">{formatDateEs(animal.deathDate)}</Row>
          )}
          {animal.deathCause && <Row label="Causa">{animal.deathCause}</Row>}
          {animal.notes && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Notas
              </div>
              <p className="whitespace-pre-wrap">{animal.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" size="lg">
          <Link href={editHref}>
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="lg"
          onClick={() => setAskDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
      </div>

      <ConfirmDialog
        open={askDelete}
        onOpenChange={setAskDelete}
        title="¿Eliminar este animal?"
        description="Se borrarán también sus vacunas, enfermedades y crianzas. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() =>
          new Promise((resolve) => {
            startTransition(async () => {
              const r = await onDelete();
              resolve(r ?? { ok: true });
            });
          })
        }
        successMessage="Animal eliminado"
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right">{children}</span>
    </div>
  );
}
