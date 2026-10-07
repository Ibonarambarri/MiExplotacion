"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Plus,
  Rabbit,
  Syringe,
} from "lucide-react";
import { SheepIcon } from "@/components/icons/animal-icons";
import { RowIcon } from "@/components/ui/list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ActionId = "oveja" | "coneja" | "gasto" | "ingreso" | "lote" | "calendario";

type QuickAction = {
  id: ActionId;
  href: string;
  label: string;
  hint: string;
  tone: React.ComponentProps<typeof RowIcon>["tone"];
  icon: React.ReactNode;
};

const ACTIONS: QuickAction[] = [
  {
    id: "oveja",
    href: "/ovejas/nueva",
    label: "Nueva oveja",
    hint: "Alta en el rebaño",
    tone: "primary",
    icon: <SheepIcon />,
  },
  {
    id: "coneja",
    href: "/conejas/nueva",
    label: "Nueva coneja",
    hint: "Alta en la conejera",
    tone: "harvest",
    icon: <Rabbit />,
  },
  {
    id: "gasto",
    href: "/finanzas/nuevo?type=gasto",
    label: "Gasto",
    hint: "Pienso, veterinario…",
    tone: "destructive",
    icon: <ArrowUpRight />,
  },
  {
    id: "ingreso",
    href: "/finanzas/nuevo?type=ingreso",
    label: "Ingreso",
    hint: "Venta de corderos…",
    tone: "success",
    icon: <ArrowDownLeft />,
  },
  {
    id: "lote",
    href: "/ovejas/lote",
    label: "Vacunar en lote",
    hint: "Varias ovejas a la vez",
    tone: "info",
    icon: <Syringe />,
  },
  {
    id: "calendario",
    href: "/calendario",
    label: "Calendario",
    hint: "Vacunas y partos",
    tone: "warning",
    icon: <CalendarDays />,
  },
];

/** Rutas donde se muestra el botón "+" (pantallas raíz, no formularios ni fichas). */
const VISIBLE_ON = new Set(["/", "/ovejas", "/conejas", "/finanzas", "/calendario"]);

/** Acción destacada según la pantalla actual. */
function contextualIds(pathname: string): ActionId[] {
  if (pathname === "/ovejas") return ["oveja"];
  if (pathname === "/conejas") return ["coneja"];
  if (pathname === "/finanzas") return ["gasto", "ingreso"];
  return [];
}

export function QuickActions() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Cierra el sheet al cambiar de pantalla (patrón "ajustar estado al render").
  const [lastPath, setLastPath] = React.useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  if (!VISIBLE_ON.has(pathname)) return null;

  const featuredIds = contextualIds(pathname);
  const featured = ACTIONS.filter((a) => featuredIds.includes(a.id));
  const rest = ACTIONS.filter(
    (a) =>
      !featuredIds.includes(a.id) &&
      !(a.id === "calendario" && pathname === "/calendario"),
  );
  const primaryLabel = featured.length === 1 ? featured[0].label : "Añadir";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        aria-label="Acciones rápidas"
        title={primaryLabel}
        style={{ viewTransitionName: "quick-fab" }}
        className={cn(
          "pressable fixed right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background/70",
          "bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)]",
          "focus-visible:outline-none focus-visible:ring-ring",
          "[-webkit-tap-highlight-color:transparent]",
        )}
      >
        <Plus className="h-7 w-7" strokeWidth={2.4} aria-hidden />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir</DialogTitle>
          <DialogDescription>¿Qué quieres registrar?</DialogDescription>
        </DialogHeader>

        {featured.length > 0 && (
          <div className={cn("grid gap-2", featured.length > 1 && "grid-cols-2")}>
            {featured.map((a) => (
              <ActionTile key={a.id} action={a} featured onSelect={() => setOpen(false)} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {rest.map((a) => (
            <ActionTile key={a.id} action={a} onSelect={() => setOpen(false)} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActionTile({
  action,
  featured,
  onSelect,
}: {
  action: QuickAction;
  featured?: boolean;
  onSelect: () => void;
}) {
  return (
    <Link
      href={action.href}
      onClick={onSelect}
      className={cn(
        "pressable flex min-h-[88px] flex-col justify-between gap-3 rounded-2xl border border-border/60 bg-card p-3.5 text-left",
        "active:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        featured && "min-h-0 flex-row items-center border-primary/25 bg-primary/8",
      )}
    >
      <RowIcon tone={action.tone} className={cn(featured && "h-11 w-11 rounded-2xl")}>
        {action.icon}
      </RowIcon>
      <span className={cn("min-w-0", featured && "flex-1")}>
        <span className="block truncate text-[15px] font-semibold leading-tight">
          {action.label}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {action.hint}
        </span>
      </span>
    </Link>
  );
}
