"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListGroup, ListRow } from "@/components/ui/list";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/animal/status-badge";
import { ageLabel } from "@/lib/dates";
import { formatDateEs } from "@/lib/utils";
import { deleteSheepAction } from "@/actions/sheep";
import { deleteRabbitAction } from "@/actions/rabbits";
import type { AnimalStatus } from "@/lib/validations";

export interface DataTabAnimal {
  tagId: string;
  nickname: string | null;
  birthDate: string | null;
  status: AnimalStatus;
  deathDate: string | null;
  deathCause: string | null;
  notes: string | null;
}

export function DataTab({
  kind,
  id,
  animal,
  tagLabel,
  mother,
  editHref,
}: {
  kind: "oveja" | "coneja";
  id: number;
  animal: DataTabAnimal;
  tagLabel: string;
  mother: { href: string; label: string } | null;
  editHref: string;
}) {
  const [askDelete, setAskDelete] = useState(false);
  const age = ageLabel(animal.birthDate);

  return (
    <div className="space-y-4">
      <ListGroup>
        <ListRow title={tagLabel} trailing={<span className="font-mono text-[15px]">{animal.tagId}</span>} />
        <ListRow title="Apodo" trailing={<span className="text-muted-foreground">{animal.nickname || "—"}</span>} />
        <ListRow
          title="Nacimiento"
          trailing={
            <span className="tabular text-muted-foreground">
              {animal.birthDate ? `${formatDateEs(animal.birthDate)}${age ? ` · ${age}` : ""}` : "—"}
            </span>
          }
        />
        {mother ? (
          <ListRow title="Madre" href={mother.href} trailing={<span className="text-primary">{mother.label}</span>} />
        ) : (
          <ListRow title="Madre" trailing={<span className="text-muted-foreground">—</span>} />
        )}
        <ListRow title="Estado" trailing={<StatusBadge status={animal.status} />} />
        {animal.deathDate && (
          <ListRow
            title="Fecha de baja"
            trailing={<span className="tabular text-muted-foreground">{formatDateEs(animal.deathDate)}</span>}
          />
        )}
      </ListGroup>

      {(animal.deathCause || animal.notes) && (
        <ListGroup title="Notas">
          {animal.deathCause && (
            <li className="px-4 py-3 text-[15px]">
              <span className="text-muted-foreground">Causa de baja: </span>
              {animal.deathCause}
            </li>
          )}
          {animal.notes && (
            <li className="whitespace-pre-wrap px-4 py-3 text-[15px]">{animal.notes}</li>
          )}
        </ListGroup>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" size="lg">
          <Link href={editHref}>
            <Pencil className="h-4 w-4" aria-hidden />
            Editar
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="text-destructive hover:text-destructive"
          onClick={() => setAskDelete(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Eliminar
        </Button>
      </div>

      <DeleteAnimalDialog
        open={askDelete}
        onOpenChange={setAskDelete}
        onDelete={async () => {
          if (kind === "oveja") await deleteSheepAction(id);
          else await deleteRabbitAction(id);
        }}
      />
    </div>
  );
}

/** Borrar un animal entero: SIEMPRE con confirmación explícita. */
export function DeleteAnimalDialog({
  open,
  onOpenChange,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDelete: () => Promise<{ ok: boolean; error?: string } | void>;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="¿Eliminar este animal?"
      description="Se borrarán también sus vacunas, enfermedades, crianzas y pesajes. Los movimientos de Finanzas se conservan. Esta acción no se puede deshacer. Si se ha vendido o ha muerto, mejor cambia su estado en Editar."
      confirmLabel="Eliminar definitivamente"
      onConfirm={async () => {
        const r = await onDelete();
        return r ?? { ok: true };
      }}
      successMessage="Animal eliminado"
    />
  );
}
