"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/forms/field";
import { animalStatusLabels } from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";
import type { Sheep, Rabbit } from "@/db/schema";
import type { AnimalOption } from "@/lib/queries/animals-select";

type SubmitAction = (
  prev: ActionResult | null,
  fd: FormData,
) => Promise<ActionResult>;

export function AnimalForm({
  action,
  initial,
  submitLabel,
  cancelHref,
  tagPlaceholder = "ES-0001",
  tagLabel = "Crotal",
  motherOptions = [],
  defaultMotherId,
}: {
  action: SubmitAction;
  initial?: Sheep | Rabbit | null;
  submitLabel: string;
  cancelHref: string;
  tagPlaceholder?: string;
  tagLabel?: string;
  /** Animales de la misma especie que pueden ser la madre. */
  motherOptions?: AnimalOption[];
  defaultMotherId?: number;
}) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(async (prev, fd) => {
    const res = await action(prev, fd);
    if (!res.ok) toast.error(res.error);
    return res;
  }, null);

  const [status, setStatus] = useState<string>(initial?.status ?? "activo");
  const isDead = status === "muerto" || status === "sacrificado";

  const fe = !state?.ok ? state?.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4">
      <Field label={tagLabel} htmlFor="tagId" required error={fe?.tagId}>
        <Input
          id="tagId"
          name="tagId"
          autoCapitalize="characters"
          autoComplete="off"
          required
          defaultValue={initial?.tagId}
          placeholder={tagPlaceholder}
        />
      </Field>

      <Field label="Apodo" htmlFor="nickname" hint="Opcional" error={fe?.nickname}>
        <Input
          id="nickname"
          name="nickname"
          autoComplete="off"
          defaultValue={initial?.nickname ?? ""}
        />
      </Field>

      <Field
        label="Madre"
        htmlFor="motherId"
        hint="Solo si nació en la explotación."
        error={fe?.motherId}
      >
        <NativeSelect
          id="motherId"
          name="motherId"
          defaultValue={String(initial?.motherId ?? defaultMotherId ?? "")}
        >
          <option value="">Sin madre registrada</option>
          {motherOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field
        label="Fecha de nacimiento"
        htmlFor="birthDate"
        error={fe?.birthDate}
      >
        <Input
          id="birthDate"
          name="birthDate"
          type="date"
          defaultValue={initial?.birthDate ?? ""}
        />
      </Field>

      <Field label="Estado" htmlFor="status" required error={fe?.status}>
        <NativeSelect
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {Object.entries(animalStatusLabels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </NativeSelect>
      </Field>

      {isDead && (
        <>
          <Field
            label="Fecha de baja"
            htmlFor="deathDate"
            required
            error={fe?.deathDate}
          >
            <Input
              id="deathDate"
              name="deathDate"
              type="date"
              defaultValue={initial?.deathDate ?? ""}
              required
            />
          </Field>
          <Field
            label="Causa"
            htmlFor="deathCause"
            error={fe?.deathCause}
          >
            <Textarea
              id="deathCause"
              name="deathCause"
              rows={2}
              defaultValue={initial?.deathCause ?? ""}
            />
          </Field>
        </>
      )}

      <Field label="Notas" htmlFor="notes" error={fe?.notes}>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" size="lg" className="flex-1" disabled={isPending}>
          {isPending ? "Guardando…" : submitLabel}
        </Button>
        <Button asChild type="button" variant="outline" size="lg">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
