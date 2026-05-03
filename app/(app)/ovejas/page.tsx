import Link from "next/link";
import { Sheet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/animal/status-badge";
import { listSheep } from "@/lib/queries/sheep";
import { animalStatus } from "@/lib/validations";
import { formatDateEs } from "@/lib/utils";
import { SheepFilters } from "./sheep-filters";

export const dynamic = "force-dynamic";

export default async function OvejasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const search = sp.q ?? "";
  const statusParam = sp.status ?? "all";
  const parsedStatus = animalStatus.safeParse(statusParam);
  const status = parsedStatus.success ? parsedStatus.data : "all";

  const items = await listSheep({ search, status });

  const hasFilters = !!search || status !== "all";

  return (
    <div>
      <PageHeader
        title="Ovejas"
        description={`${items.length} ${
          items.length === 1 ? "oveja" : "ovejas"
        }${hasFilters ? " (filtradas)" : ""}`}
      />

      <SheepFilters initialSearch={search} initialStatus={statusParam} />

      <div className="mt-4 grid gap-2">
        {items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={<Sheet className="h-6 w-6" />}
              title="Sin resultados"
              description="Prueba con otros términos o cambia el filtro."
            />
          ) : (
            <EmptyState
              icon={<Sheet className="h-6 w-6" />}
              title="Sin ovejas registradas"
              description="Empieza dando de alta tu primera oveja."
              action={
                <Button asChild>
                  <Link href="/ovejas/nueva">Nueva oveja</Link>
                </Button>
              }
            />
          )
        ) : (
          items.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <Link
                href={`/ovejas/${s.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">
                      {s.nickname || s.tagId}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{s.tagId}</span>
                    {s.birthDate && (
                      <>
                        <span aria-hidden>·</span>
                        <span>nac. {formatDateEs(s.birthDate)}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
