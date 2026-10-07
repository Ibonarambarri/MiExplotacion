import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

/** Oveja estilo lucide (trazo 2, 24×24) — lucide no trae oveja. */
export function SheepIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {/* Lana: nube ondulada */}
      <path d="M7.5 17.5a3 3 0 0 1-1.9-5.3 3 3 0 0 1 3.4-4.4 3.5 3.5 0 0 1 6.2-.3 3 3 0 0 1 3.6 3.6 3 3 0 0 1-1.3 5.6 3 3 0 0 1-4.6.9 3 3 0 0 1-5.4-.1Z" />
      {/* Cabeza */}
      <path d="M5.6 12.2 3.6 11.4a1.6 1.6 0 0 1-.9-2.2l.5-1a1.8 1.8 0 0 1 2.6-.6l1.2.8" />
      {/* Patas */}
      <path d="M9.5 18v3" />
      <path d="M15.5 18v3" />
    </svg>
  );
}

export { Rabbit as RabbitIcon } from "lucide-react";
