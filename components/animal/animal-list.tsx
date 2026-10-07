"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, Syringe, X } from "lucide-react";
import { ListGroup, ListRow } from "@/components/ui/list";
import { ChipGroup, Chip } from "@/components/ui/chip";
import { AnimalAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { SheepIcon, RabbitIcon } from "@/components/icons/animal-icons";
import { BatchVaccineDialog } from "@/components/animal/batch-vaccine-dialog";
import {
  LIST_FILTERS,
  matchesFilter,
  matchesSearch,
  type AnimalRowVM,
  type ListFilter,
} from "@/components/animal/list-model";
import { cn } from "@/lib/utils";

const TEXT = {
  oveja: { one: "oveja", many: "ovejas", base: "/ovejas", tag: "crotal" },
  coneja: { one: "coneja", many: "conejas", base: "/conejas", tag: "identificador" },
} as const;

/** Sustituye la URL sin navegar (el servidor no se vuelve a pedir). */
function replaceQuery(patch: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(patch)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  window.history.replaceState(null, "", url);
}

export function AnimalList({
  kind,
  rows,
  initialQuery,
  initialFilter,
  presets,
  batchMode = false,
}: {
  kind: "oveja" | "coneja";
  rows: AnimalRowVM[];
  initialQuery: string;
  initialFilter: ListFilter;
  presets: string[];
  /** Ruta /lote: arranca directamente en modo selección. */
  batchMode?: boolean;
}) {
  const t = TEXT[kind];
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<ListFilter>(initialFilter);
  const [selecting, setSelecting] = useState(batchMode);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [batchOpen, setBatchOpen] = useState(false);

  const searched = useMemo(
    () => rows.filter((r) => matchesSearch(r, query)),
    [rows, query],
  );
  const counts = useMemo(() => {
    const c = {} as Record<ListFilter, number>;
    for (const f of LIST_FILTERS) c[f.key] = searched.filter((r) => matchesFilter(r, f.key)).length;
    return c;
  }, [searched]);
  const visible = useMemo(
    () => searched.filter((r) => matchesFilter(r, filter)),
    [searched, filter],
  );

  function changeFilter(f: ListFilter) {
    setFilter(f);
    replaceQuery({ f: f === "activas" ? null : f });
  }
  function changeQuery(q: string) {
    setQuery(q);
    replaceQuery({ q: q.trim() || null });
  }
  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function exitSelection() {
    if (batchMode) {
      router.push(t.base);
      return;
    }
    setSelecting(false);
    setSelected(new Set());
  }
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));
  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((r) => next.delete(r.id));
      else visible.forEach((r) => next.add(r.id));
      return next;
    });
  }

  const Icon = kind === "oveja" ? SheepIcon : RabbitIcon;

  return (
    <div className={cn("space-y-3", selecting && "pb-24")}>
      {/* Buscador + Seleccionar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            aria-label={`Buscar por ${t.tag} o apodo`}
            placeholder={`Buscar ${t.one}…`}
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            className="h-11 w-full rounded-full border border-input bg-card pl-10 pr-4 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {selecting ? (
          <Button variant="ghost" className="px-3 text-primary" onClick={exitSelection}>
            {batchMode ? "Cancelar" : "Hecho"}
          </Button>
        ) : (
          <Button variant="ghost" className="px-3 text-primary" onClick={() => setSelecting(true)}>
            Seleccionar
          </Button>
        )}
      </div>

      <ChipGroup label="Filtrar">
        {LIST_FILTERS.map((f) => (
          <Chip
            key={f.key}
            active={filter === f.key}
            count={counts[f.key]}
            onClick={() => changeFilter(f.key)}
          >
            {f.label}
          </Chip>
        ))}
      </ChipGroup>

      {selecting && (
        <div className="flex items-center justify-between px-1 text-sm">
          <span className="tabular text-muted-foreground" aria-live="polite">
            {selected.size === 0
              ? `Toca las ${t.many} que quieras incluir`
              : `${selected.size} ${selected.size === 1 ? "seleccionada" : "seleccionadas"}`}
          </span>
          {visible.length > 0 && (
            <button
              type="button"
              onClick={toggleAllVisible}
              className="pressable -mr-2 h-11 rounded-lg px-2 font-medium text-primary"
            >
              {allVisibleSelected ? "Quitar todas" : "Marcar todas"}
            </button>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        rows.length === 0 ? (
          <EmptyState
            icon={<Icon className="h-6 w-6" />}
            title={`Sin ${t.many} registradas`}
            description={`Da de alta tu primera ${t.one} con el botón +.`}
          />
        ) : (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="Sin resultados"
            description="Prueba con otra búsqueda o cambia el filtro."
          />
        )
      ) : (
        <ListGroup>
          {visible.map((r) => {
            const isSel = selected.has(r.id);
            const subtitle = [r.hasNickname ? r.tagId : null, r.age]
              .filter(Boolean)
              .join(" · ");
            return (
              <ListRow
                key={r.id}
                href={selecting ? undefined : `${t.base}/${r.id}`}
                onClick={selecting ? () => toggle(r.id) : undefined}
                chevron={!selecting}
                className={cn(selecting && isSel && "bg-primary/5")}
                leading={
                  <span className="relative block">
                    <AnimalAvatar name={r.name} seed={r.tagId} src={r.thumb} />
                    {selecting && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card transition-[background-color,transform] duration-150",
                          isSel
                            ? "scale-100 bg-primary text-primary-foreground"
                            : "scale-90 bg-muted",
                        )}
                      >
                        {isSel && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                    )}
                  </span>
                }
                title={
                  <>
                    <span className={cn(!r.hasNickname && "font-mono text-[14px]")}>{r.name}</span>
                    {selecting && (
                      <span className="sr-only">{isSel ? ", seleccionada" : ", sin seleccionar"}</span>
                    )}
                  </>
                }
                subtitle={subtitle ? <span className="tabular">{subtitle}</span> : undefined}
                trailing={<RowChips r={r} />}
              />
            );
          })}
        </ListGroup>
      )}

      {selecting && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[45] border-t border-border/60 bg-background/95 backdrop-blur animate-in slide-in-from-bottom-4 fade-in-0 duration-200">
          <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Salir de la selección"
              onClick={exitSelection}
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              className="flex-1"
              size="lg"
              disabled={selected.size === 0}
              onClick={() => setBatchOpen(true)}
            >
              <Syringe className="h-4 w-4" aria-hidden />
              Vacunar / desparasitar
              <span className="tabular">({selected.size})</span>
            </Button>
          </div>
        </div>
      )}

      <BatchVaccineDialog
        kind={kind}
        open={batchOpen}
        onOpenChange={setBatchOpen}
        ids={[...selected]}
        presets={presets}
        onDone={() => {
          setBatchOpen(false);
          if (batchMode) {
            router.push(t.base);
          } else {
            setSelecting(false);
            setSelected(new Set());
          }
        }}
      />
    </div>
  );
}

function RowChips({ r }: { r: AnimalRowVM }) {
  // Una sola etiqueta (la más urgente) para que el crotal no se corte; el
  // resto se resume en "+N".
  const chips: React.ReactNode[] = [];
  if (r.vaccineOverdue) chips.push(<Badge key="v" variant="destructive">Vacuna vencida</Badge>);
  if (r.inTreatment) chips.push(<Badge key="t" variant="warning">En tratamiento</Badge>);
  if (r.pregnantDays !== null) {
    const d = r.pregnantDays;
    chips.push(
      <Badge key="p" variant="harvest">
        {d > 0 ? `Parto en ${d}d` : d === 0 ? "Parto hoy" : `Parto atrasado ${-d}d`}
      </Badge>,
    );
  }
  if (r.cull) chips.push(<Badge key="c" variant="secondary">Desvieje</Badge>);
  if (r.status !== "activo") {
    chips.push(
      <Badge key="s" variant="secondary">
        {r.status === "vendido" ? "Vendida" : r.status === "muerto" ? "Muerta" : "Sacrificada"}
      </Badge>,
    );
  }
  if (!chips.length) return null;
  return (
    <span className="flex items-center gap-1">
      {chips[0]}
      {chips.length > 1 && (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          +{chips.length - 1}
        </Badge>
      )}
    </span>
  );
}
