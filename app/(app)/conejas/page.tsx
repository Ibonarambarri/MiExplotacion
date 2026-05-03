import Link from "next/link";
import { Rabbit as RabbitIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/animal/status-badge";
import { listRabbits } from "@/lib/queries/rabbits";
import { animalStatus } from "@/lib/validations";
import { formatDateEs } from "@/lib/utils";
import { RabbitFilters } from "./rabbit-filters";

export const dynamic = "force-dynamic";

export default async function ConejasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const search = sp.q ?? "";
  const statusParam = sp.status ?? "all";
  const parsedStatus = animalStatus.safeParse(statusParam);
  const status = parsedStatus.success ? parsedStatus.data : "all";

  const items = await listRabbits({ search, status });
  const hasFilters = !!search || status !== "all";

  return (
    <div>
      <PageHeader
        title="Conejas"
        description={`${items.length} ${
          items.length === 1 ? "coneja" : "conejas"
        }${hasFilters ? " (filtradas)" : ""}`}
      />

      <RabbitFilters initialSearch={search} initialStatus={statusParam} />

      <div className="mt-4 grid gap-2">
        {items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={<RabbitIcon className="h-6 w-6" />}
              title="Sin resultados"
              description="Prueba con otros términos o cambia el filtro."
            />
          ) : (
            <EmptyState
              icon={<RabbitIcon className="h-6 w-6" />}
              title="Sin conejas registradas"
              description="Empieza dando de alta tu primera coneja."
              action={
                <Button asChild>
                  <Link href="/conejas/nueva">Nueva coneja</Link>
                </Button>
              }
            />
          )
        ) : (
          items.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <Link
                href={`/conejas/${r.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">
                      {r.nickname || r.tagId}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{r.tagId}</span>
                    {r.birthDate && (
                      <>
                        <span aria-hidden>·</span>
                        <span>nac. {formatDateEs(r.birthDate)}</span>
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
