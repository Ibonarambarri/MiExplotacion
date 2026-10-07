"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Segmented } from "@/components/ui/segmented";

type Vista = "mes" | "agenda";

/** Mes / Agenda — se refleja en ?vista= para que sea enlazable. */
export function ViewSwitch({ value, monthHref }: { value: Vista; monthHref: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(value);

  return (
    <Segmented<Vista>
      aria-label="Vista del calendario"
      value={optimistic}
      onChange={(v) =>
        startTransition(() => {
          setOptimistic(v);
          router.replace(v === "agenda" ? "/calendario?vista=agenda" : monthHref, {
            scroll: false,
          });
        })
      }
      options={[
        { value: "mes", label: "Mes" },
        { value: "agenda", label: "Agenda" },
      ]}
    />
  );
}
