import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Enlace "atrás" de las fichas.
 * TODO(integración): cuando PageHeader admita `back={{ href, label }}`,
 * sustituir este componente por esa prop.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="pressable -ml-2 mb-1 inline-flex h-11 items-center gap-0.5 rounded-lg px-2 text-[15px] font-medium text-primary"
    >
      <ChevronLeft className="h-5 w-5" aria-hidden />
      {label}
    </Link>
  );
}
