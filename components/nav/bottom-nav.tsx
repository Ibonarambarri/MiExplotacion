"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Rabbit, Wallet, Ellipsis } from "lucide-react";
import { SheepIcon } from "@/components/icons/animal-icons";
import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const items: {
  href: string;
  label: string;
  icon: IconComponent;
  exact?: boolean;
}[] = [
  { href: "/", label: "Inicio", icon: Home, exact: true },
  { href: "/ovejas", label: "Ovejas", icon: SheepIcon },
  { href: "/conejas", label: "Conejas", icon: Rabbit },
  { href: "/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/mas", label: "Más", icon: Ellipsis },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
}

/**
 * Barra de pestañas inferior. La "pill" del icono activo es un único elemento
 * que se desliza (transform) entre columnas; sin pestaña activa (p. ej. en
 * /calendario) se desvanece.
 */
export function BottomNav({ urgentCount = 0 }: { urgentCount?: number }) {
  const pathname = usePathname();
  const activeIndex = items.findIndex((i) => isActive(pathname, i.href, i.exact));

  return (
    <nav
      aria-label="Navegación principal"
      style={{ viewTransitionName: "bottom-nav" }}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-nav pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150"
    >
      <ul className="relative mx-auto grid max-w-md grid-cols-5">
        {/* Indicador deslizante */}
        <li
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 top-2 flex w-1/5 justify-center",
            "transition-[transform,opacity] duration-[250ms] ease-out-quint motion-reduce:transition-none",
            activeIndex < 0 && "opacity-0",
          )}
          style={{ transform: `translateX(${Math.max(activeIndex, 0) * 100}%)` }}
        >
          <span className="h-8 w-14 rounded-full bg-primary/12" />
        </li>

        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact);
          const badge = href === "/" && urgentCount > 0 ? urgentCount : 0;
          return (
            <li key={href} className="relative">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={
                  badge
                    ? `${label}, ${badge} ${badge === 1 ? "aviso urgente" : "avisos urgentes"}`
                    : undefined
                }
                className={cn(
                  "flex h-16 select-none flex-col items-center justify-start gap-1 pt-2 text-[11px] font-medium [-webkit-tap-highlight-color:transparent]",
                  "transition-colors duration-150 active:opacity-70",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative flex h-8 w-14 items-center justify-center">
                  <Icon
                    className="h-[22px] w-[22px]"
                    strokeWidth={active ? 2.4 : 1.8}
                    aria-hidden
                  />
                  {badge > 0 && (
                    <span
                      aria-hidden
                      className="tabular absolute right-1.5 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-2 ring-background"
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span className={cn(active && "font-semibold")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
