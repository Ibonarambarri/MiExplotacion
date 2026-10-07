import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lista agrupada estilo iOS: un contenedor redondeado con filas separadas
 * por líneas finas. Usar en lugar de "una Card por elemento".
 */
export function ListGroup({
  title,
  action,
  footer,
  className,
  children,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-2", className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-2 px-1">
          {title && (
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
        <ul className="divide-y divide-border/60">{children}</ul>
      </div>
      {footer && <div className="px-1 text-xs text-muted-foreground">{footer}</div>}
    </section>
  );
}

type ListRowProps = {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  chevron?: boolean;
  className?: string;
};

/** Fila de lista. Con `href` es un enlace; con `onClick`, un botón. */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  href,
  onClick,
  chevron,
  className,
}: ListRowProps) {
  const showChevron = chevron ?? !!href;
  const inner = (
    <>
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium leading-snug">{title}</div>
        {subtitle && (
          <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
      {showChevron && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
      )}
    </>
  );
  const rowClass = cn(
    "flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left",
    (href || onClick) && "pressable active:bg-accent/70 hover:bg-accent/40",
    className,
  );
  return (
    <li>
      {href ? (
        <Link href={href} className={rowClass}>
          {inner}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={rowClass}>
          {inner}
        </button>
      ) : (
        <div className={rowClass}>{inner}</div>
      )}
    </li>
  );
}

/** Icono cuadrado de color para filas (estilo Ajustes de iOS). */
export function RowIcon({
  children,
  tone = "primary",
  className,
}: {
  children: React.ReactNode;
  tone?: "primary" | "harvest" | "info" | "warning" | "success" | "destructive" | "muted";
  className?: string;
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/12 text-primary",
    harvest: "bg-harvest-soft text-harvest",
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
    destructive: "bg-danger-soft text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl [&_svg]:h-[18px] [&_svg]:w-[18px]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
