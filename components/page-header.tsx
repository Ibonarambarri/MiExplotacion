import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cabecera de pantalla con título grande estilo iOS.
 * `back` pinta un enlace "‹ Atrás" encima del título.
 */
export function PageHeader({
  title,
  description,
  action,
  back,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <header className={cn("pb-5", className)}>
      {back && (
        <Link
          href={back.href}
          className="pressable -ml-2 mb-1 inline-flex min-h-11 items-center gap-0.5 rounded-lg pr-2 text-[17px] text-primary active:opacity-60"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.4} aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-balance text-[32px] font-bold leading-[1.1] tracking-tight">
            {title}
          </h1>
          {description && (
            <div className="text-[15px] text-muted-foreground">{description}</div>
          )}
        </div>
        {action && <div className="shrink-0 pb-0.5">{action}</div>}
      </div>
    </header>
  );
}
