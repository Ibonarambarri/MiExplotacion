"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FabTarget {
  href: string;
  label: string;
}

function resolveTarget(pathname: string): FabTarget | null {
  if (pathname === "/ovejas") {
    return { href: "/ovejas/nueva", label: "Nueva oveja" };
  }
  if (pathname === "/conejas") {
    return { href: "/conejas/nueva", label: "Nueva coneja" };
  }
  if (pathname === "/finanzas") {
    return { href: "/finanzas/nuevo", label: "Nuevo movimiento" };
  }
  return null;
}

export function Fab({ className }: { className?: string }) {
  const pathname = usePathname();
  const target = resolveTarget(pathname);
  if (!target) return null;

  return (
    <Link
      href={target.href}
      aria-label={target.label}
      className={cn(
        "fixed right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-background transition active:scale-95 hover:bg-primary/90",
        "bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)]",
        className,
      )}
    >
      <Plus className="h-6 w-6" aria-hidden />
    </Link>
  );
}
