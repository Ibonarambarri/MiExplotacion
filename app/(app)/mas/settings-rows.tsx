"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, Home, Plus, Syringe, Timer, X } from "lucide-react";
import { ListRow, RowIcon } from "@/components/ui/list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import {
  saveFarmName,
  saveGestationDays,
  saveVaccinePresets,
} from "@/actions/settings";

type Result = { ok: true } | { ok: false; error: string };

function useSave(onDone: () => void) {
  const [pending, start] = useTransition();
  function run(fn: () => Promise<Result>) {
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success("Guardado");
        onDone();
      } else {
        toast.error(res.error);
      }
    });
  }
  return { pending, run };
}

// ─── Nombre de la explotación ───────────────────────────────────────────────
export function FarmNameRow({ value }: { value: string }) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useSave(() => setOpen(false));

  return (
    <>
      <ListRow
        leading={
          <RowIcon>
            <Home />
          </RowIcon>
        }
        title="Nombre"
        trailing={<span className="max-w-[45vw] truncate text-[15px] text-muted-foreground">{value}</span>}
        onClick={() => setOpen(true)}
        chevron
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nombre de la explotación</DialogTitle>
            <DialogDescription>Aparece en Inicio y en el libro de explotación.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            action={(fd) => run(() => saveFarmName(String(fd.get("farmName") ?? "")))}
          >
            <Field label="Nombre" htmlFor="farmName">
              <Input
                id="farmName"
                name="farmName"
                defaultValue={value}
                maxLength={60}
                required
                autoComplete="off"
                enterKeyHint="done"
              />
            </Field>
            <DialogFooter>
              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Días de gestación ──────────────────────────────────────────────────────
export function GestationRows({ sheep, rabbit }: { sheep: number; rabbit: number }) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useSave(() => setOpen(false));
  const icon = (
    <RowIcon tone="harvest">
      <Timer />
    </RowIcon>
  );

  return (
    <>
      <ListRow
        leading={icon}
        title="Ovejas"
        trailing={<span className="tabular text-[15px] text-muted-foreground">{sheep} días</span>}
        onClick={() => setOpen(true)}
        chevron
      />
      <ListRow
        leading={icon}
        title="Conejas"
        trailing={<span className="tabular text-[15px] text-muted-foreground">{rabbit} días</span>}
        onClick={() => setOpen(true)}
        chevron
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Días de gestación</DialogTitle>
            <DialogDescription>
              Se usan para calcular la fecha prevista de parto al registrar una cubrición.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            action={(fd) =>
              run(() =>
                saveGestationDays({
                  sheep: String(fd.get("sheep") ?? ""),
                  rabbit: String(fd.get("rabbit") ?? ""),
                }),
              )
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ovejas" htmlFor="g-sheep" hint="Normal: 150">
                <Input
                  id="g-sheep"
                  name="sheep"
                  type="number"
                  inputMode="numeric"
                  min={130}
                  max={170}
                  defaultValue={sheep}
                  required
                />
              </Field>
              <Field label="Conejas" htmlFor="g-rabbit" hint="Normal: 31">
                <Input
                  id="g-rabbit"
                  name="rabbit"
                  type="number"
                  inputMode="numeric"
                  min={25}
                  max={40}
                  defaultValue={rabbit}
                  required
                />
              </Field>
            </div>
            <DialogFooter>
              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Vacunas sugeridas ──────────────────────────────────────────────────────
export function VaccinePresetsRow({ presets }: { presets: string[] }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(presets);
  const [draft, setDraft] = useState("");
  const { pending, run } = useSave(() => setOpen(false));

  function openSheet() {
    setList(presets);
    setDraft("");
    setOpen(true);
  }

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (list.some((p) => p.toLocaleLowerCase("es") === v.toLocaleLowerCase("es"))) {
      toast("Ya está en la lista");
      return;
    }
    setList((l) => [...l, v]);
    setDraft("");
  }

  return (
    <>
      <ListRow
        leading={
          <RowIcon tone="info">
            <Syringe />
          </RowIcon>
        }
        title="Vacunas sugeridas"
        subtitle={presets.length ? presets.join(", ") : "Ninguna"}
        trailing={<span className="tabular text-[15px] text-muted-foreground">{presets.length}</span>}
        onClick={openSheet}
        chevron
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vacunas sugeridas</DialogTitle>
            <DialogDescription>
              Aparecen como atajos al registrar una vacuna o tratamiento.
            </DialogDescription>
          </DialogHeader>

          <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
            {list.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground">La lista está vacía.</li>
            )}
            {list.map((p) => (
              <li key={p} className="flex min-h-12 items-center gap-2 pl-4 pr-1.5">
                <span className="min-w-0 flex-1 truncate text-[15px]">{p}</span>
                <button
                  type="button"
                  onClick={() => setList((l) => l.filter((x) => x !== p))}
                  aria-label={`Quitar ${p}`}
                  className="pressable inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground active:bg-accent"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <Input
              aria-label="Nueva vacuna"
              placeholder="Añadir vacuna…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={128}
              enterKeyHint="done"
              autoComplete="off"
            />
            <Button type="submit" variant="secondary" size="icon" aria-label="Añadir" disabled={!draft.trim()}>
              <Plus className="h-5 w-5" aria-hidden />
            </Button>
          </form>

          <DialogFooter>
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={pending}
              onClick={() => run(() => saveVaccinePresets(list))}
            >
              Guardar lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Instalar app ───────────────────────────────────────────────────────────
export function InstallRow() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListRow
        leading={
          <RowIcon tone="success">
            <Download />
          </RowIcon>
        }
        title="Instalar app"
        subtitle="Añadir Mi Explotación a la pantalla de inicio"
        onClick={() => setOpen(true)}
        chevron
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar Mi Explotación</DialogTitle>
            <DialogDescription>
              Se abre a pantalla completa, funciona sin conexión con los datos ya vistos y
              permite recibir avisos.
            </DialogDescription>
          </DialogHeader>
          <InstallPrompt />
        </DialogContent>
      </Dialog>
    </>
  );
}
