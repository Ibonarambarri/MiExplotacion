"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/field";
import { promoteLambAction } from "@/actions/sheep-breedings";
import { formatDateEs } from "@/lib/utils";
import type { ActionResult } from "@/actions/sheep";
import type { Lamb } from "@/db/schema";

/** Pasar una cordera al rebaño: crea su ficha de oveja con madre y nacimiento. */
export function PromoteLambDialog({
  open,
  onOpenChange,
  sheepId,
  breedingId,
  lamb,
  birthDate,
  motherName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sheepId: number;
  breedingId: number;
  lamb: Lamb;
  birthDate: string | null;
  motherName: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ id: number }> | null,
    FormData
  >(async (prev, fd) => {
    const res = await promoteLambAction(sheepId, breedingId, lamb.id, prev, fd);
    if (res.ok) {
      onOpenChange(false);
      const newId = res.data?.id;
      toast.success("Ya está en el rebaño", {
        action: newId
          ? { label: "Ver ficha", onClick: () => router.push(`/ovejas/${newId}`) }
          : undefined,
      });
    } else {
      toast.error(res.error);
    }
    return res;
  }, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pasar al rebaño</DialogTitle>
          <DialogDescription>
            Se creará su ficha de oveja como hija de {motherName}
            {birthDate ? `, nacida el ${formatDateEs(birthDate)}` : ""}.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <Field label="Crotal" htmlFor="promote-tag" required error={fe?.tagId}>
            <Input
              id="promote-tag"
              name="tagId"
              required
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="ES-0001"
            />
          </Field>
          <Field label="Apodo" htmlFor="promote-nick" error={fe?.nickname}>
            <Input
              id="promote-nick"
              name="nickname"
              autoComplete="off"
              defaultValue={lamb.nickname ?? ""}
              placeholder="(opcional)"
            />
          </Field>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando…" : "Crear oveja"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
