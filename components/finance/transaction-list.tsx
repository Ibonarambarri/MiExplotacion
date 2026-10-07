"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteTransactionAction,
  restoreTransactionAction,
} from "@/actions/transactions";
import { MONTHS_ES, MONTHS_ES_SHORT, daysBetweenIso } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { TransactionWithAnimal } from "@/lib/queries/transactions";
import { CATEGORY_META, CategoryIcon } from "./category-meta";
import { fmtEur, fmtSigned } from "./format";

type Tx = TransactionWithAnimal;

const REVEAL = 88; // ancho del botón "Eliminar" revelado (px)

const weekdayFmt = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  timeZone: "UTC",
});

function isoParts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dayLabel(iso: string, today: string): string {
  const diff = daysBetweenIso(iso, today);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  const { y, m, d } = isoParts(iso);
  const wd = weekdayFmt.format(new Date(Date.UTC(y, m - 1, d)));
  const sameYear = y === isoParts(today).y;
  return capitalize(`${wd} ${d} ${MONTHS_ES_SHORT[m - 1]}${sameYear ? "" : ` ${y}`}`);
}

function longDate(iso: string): string {
  const { y, m, d } = isoParts(iso);
  const wd = weekdayFmt.format(new Date(Date.UTC(y, m - 1, d)));
  return capitalize(`${wd}, ${d} de ${MONTHS_ES[m - 1]} de ${y}`);
}

function animalOf(tx: Tx): { label: string; href: string | null } | null {
  if (tx.sheepId && tx.sheepLabel)
    return { label: tx.sheepLabel, href: `/ovejas/${tx.sheepId}` };
  if (tx.rabbitId && tx.rabbitLabel)
    return { label: tx.rabbitLabel, href: `/conejas/${tx.rabbitId}` };
  if (tx.lambLabel) return { label: tx.lambLabel, href: null };
  if (tx.litterId) return { label: "Camada", href: null };
  return null;
}

const isAuto = (tx: Tx) => tx.lambId !== null || tx.litterId !== null;
const signedAmount = (tx: Tx) =>
  (tx.type === "ingreso" ? 1 : -1) * Number(tx.amountEur);

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduce;
}

export function TransactionList({
  transactions,
  today,
}: {
  transactions: Tx[];
  /** Hoy (YYYY-MM-DD, zona de la explotación), calculado en el servidor. */
  today: string;
}) {
  const [hidden, setHidden] = useState<Set<number>>(() => new Set());
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Tx | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  const groups = useMemo(() => {
    const map = new Map<string, Tx[]>();
    for (const tx of transactions) {
      if (hidden.has(tx.id)) continue;
      const list = map.get(tx.date);
      if (list) list.push(tx);
      else map.set(tx.date, [tx]);
    }
    return [...map.entries()];
  }, [transactions, hidden]);

  function setHiddenFlag(id: number, value: boolean) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function remove(tx: Tx) {
    setOpenSwipeId(null);
    setDetailOpen(false);
    setHiddenFlag(tx.id, true);

    const res = await deleteTransactionAction(tx.id);
    if (!res.ok || !res.data) {
      setHiddenFlag(tx.id, false);
      toast.error(res.ok ? "No se pudo eliminar." : res.error);
      return;
    }
    const snapshot = res.data;
    toast("Movimiento eliminado", {
      description: `${tx.description || CATEGORY_META[tx.category].label} · ${fmtSigned(signedAmount(tx))}`,
      duration: 6000,
      action: {
        label: "Deshacer",
        onClick: async () => {
          const r = await restoreTransactionAction(snapshot);
          if (r.ok) {
            setHiddenFlag(tx.id, false);
            toast.success("Movimiento restaurado");
          } else {
            toast.error(r.error);
          }
        },
      },
    });
  }

  if (groups.length === 0) return null;

  return (
    <>
      <div className="space-y-4">
        {groups.map(([date, items]) => {
          const dayTotal = items.reduce((s, t) => s + signedAmount(t), 0);
          return (
            <section key={date} aria-label={dayLabel(date, today)}>
              <div className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 flex items-baseline justify-between bg-background/90 px-5 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/75">
                <h3 className="text-[13px] font-semibold text-muted-foreground">
                  {dayLabel(date, today)}
                </h3>
                <span className="tabular text-xs text-muted-foreground">
                  {fmtSigned(dayTotal)}
                </span>
              </div>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                {items.map((tx) => (
                  <SwipeRow
                    key={tx.id}
                    tx={tx}
                    open={openSwipeId === tx.id}
                    reduceMotion={reduceMotion}
                    onOpenChange={(o) => setOpenSwipeId(o ? tx.id : null)}
                    onSelect={() => {
                      setOpenSwipeId(null);
                      setDetail(tx);
                      setDetailOpen(true);
                    }}
                    onDelete={() => remove(tx)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          {detail && (
            <TransactionDetail tx={detail} onDelete={() => remove(detail)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RowContent({ tx }: { tx: Tx }) {
  const meta = CATEGORY_META[tx.category];
  const animal = animalOf(tx);
  const income = tx.type === "ingreso";
  return (
    <>
      <CategoryIcon category={tx.category} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-medium leading-snug">
            {tx.description || meta.label}
          </span>
          {isAuto(tx) && (
            <Badge variant="info" className="px-1.5 py-0 text-[10px]">
              Auto
            </Badge>
          )}
        </div>
        <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {meta.label}
          {animal ? ` · ${animal.label}` : ""}
        </div>
      </div>
      <span
        className={cn(
          "tabular shrink-0 text-[15px] font-semibold",
          income && "text-success",
        )}
      >
        {income ? "+" : "−"}
        {fmtEur(Number(tx.amountEur))}
      </span>
    </>
  );
}

function SwipeRow({
  tx,
  open,
  reduceMotion,
  onOpenChange,
  onSelect,
  onDelete,
}: {
  tx: Tx;
  open: boolean;
  reduceMotion: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    base: number;
    axis: "x" | "y" | null;
    pointerId: number;
  } | null>(null);
  const suppressClick = useRef(false);

  const offset = drag ?? (open ? -REVEAL : 0);

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = {
      x: e.clientX,
      y: e.clientY,
      base: open ? -REVEAL : 0,
      axis: null,
      pointerId: e.pointerId,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (g.axis === "y") {
        gesture.current = null;
        return;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    let next = g.base + dx;
    // Resistencia elástica fuera del rango útil.
    if (next > 0) next = next * 0.2;
    if (next < -REVEAL) next = -REVEAL + (next + REVEAL) * 0.3;
    setDrag(next);
  }

  function endGesture(e: React.PointerEvent<HTMLButtonElement>) {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.axis !== "x" || drag === null) {
      setDrag(null);
      return;
    }
    suppressClick.current = true;
    // Algunos navegadores no emiten click tras un arrastre: no bloquear el siguiente toque.
    setTimeout(() => {
      suppressClick.current = false;
    }, 0);
    const shouldOpen = drag < -REVEAL / 2;
    setDrag(null);
    onOpenChange(shouldOpen);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function onClick() {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (open) onOpenChange(false);
    else onSelect();
  }

  const income = tx.type === "ingreso";
  const label = `${tx.description || CATEGORY_META[tx.category].label}, ${income ? "ingreso" : "gasto"} de ${fmtEur(Number(tx.amountEur))}`;

  return (
    <li className="relative overflow-hidden">
      {/* Acción revelada al deslizar */}
      <div className="absolute inset-0 flex justify-end bg-destructive">
        <button
          type="button"
          onClick={onDelete}
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          className="flex h-full flex-col items-center justify-center gap-0.5 text-xs font-semibold text-destructive-foreground"
          style={{ width: REVEAL }}
        >
          <Trash2 className="h-5 w-5" aria-hidden />
          Eliminar
        </button>
      </div>

      <button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        aria-label={label}
        aria-haspopup="dialog"
        className="relative flex min-h-16 w-full touch-pan-y items-center gap-3 bg-card px-4 py-2.5 text-left select-none active:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        style={{
          transform: `translate3d(${offset}px,0,0)`,
          transition:
            drag !== null || reduceMotion
              ? "none"
              : "transform 240ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <RowContent tx={tx} />
      </button>
    </li>
  );
}

function TransactionDetail({ tx, onDelete }: { tx: Tx; onDelete: () => void }) {
  const meta = CATEGORY_META[tx.category];
  const animal = animalOf(tx);
  const income = tx.type === "ingreso";
  const auto = isAuto(tx);

  return (
    <>
      <DialogHeader className="items-center pr-0 pt-2 text-center">
        <CategoryIcon category={tx.category} className="h-12 w-12 rounded-2xl [&_svg]:h-6 [&_svg]:w-6" />
        <DialogTitle className="mt-2">{tx.description || meta.label}</DialogTitle>
        <DialogDescription>{longDate(tx.date)}</DialogDescription>
        <div
          className={cn(
            "tabular mt-1 text-3xl font-semibold tracking-tight",
            income && "text-success",
          )}
        >
          {income ? "+" : "−"}
          {fmtEur(Number(tx.amountEur))}
        </div>
      </DialogHeader>

      <dl className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-muted/60 text-sm">
        <DetailRow label="Tipo" value={income ? "Ingreso" : "Gasto"} />
        <DetailRow label="Categoría" value={meta.label} />
        {animal && (
          <DetailRow
            label="Animal"
            value={
              animal.href ? (
                <Link href={animal.href} className="font-medium text-primary">
                  {animal.label}
                </Link>
              ) : (
                animal.label
              )
            }
          />
        )}
        {tx.description && <DetailRow label="Descripción" value={tx.description} />}
        {auto && (
          <DetailRow
            label="Origen"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Badge variant="info">Auto</Badge>
                {tx.lambId ? "Venta de cordero" : "Matanza de camada"}
              </span>
            }
          />
        )}
      </dl>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" size="lg">
          <Link href={`/finanzas/${tx.id}/editar`}>
            <Pencil className="h-4 w-4" aria-hidden />
            Editar
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onDelete}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Eliminar
        </Button>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right break-words">{value}</dd>
    </div>
  );
}
