import { PageHeader } from "@/components/page-header";
import { AnimalList } from "@/components/animal/animal-list";
import { BackLink } from "@/components/animal/back-link";
import { buildRows, parseFilter } from "@/components/animal/list-model";
import { listSheep } from "@/lib/queries/sheep";
import { listRabbits } from "@/lib/queries/rabbits";
import { getAnimalFlags } from "@/lib/queries/indicators";
import { getSettings } from "@/lib/settings";

/** Listado compartido de ovejas y conejas (y su variante /lote). */
export async function AnimalListPage({
  kind,
  searchParams,
  batchMode = false,
}: {
  kind: "oveja" | "coneja";
  searchParams: Promise<{ q?: string; f?: string }>;
  batchMode?: boolean;
}) {
  const sp = await searchParams;
  const [items, flags, settings] = await Promise.all([
    kind === "oveja" ? listSheep() : listRabbits(),
    getAnimalFlags(kind),
    getSettings(),
  ]);
  const rows = buildRows(items, flags);
  const active = rows.filter((r) => r.status === "activo").length;
  const many = kind === "oveja" ? "ovejas" : "conejas";
  const base = kind === "oveja" ? "/ovejas" : "/conejas";

  return (
    <div>
      {batchMode && <BackLink href={base} label={kind === "oveja" ? "Ovejas" : "Conejas"} />}
      <PageHeader
        title={batchMode ? "Vacunar en lote" : kind === "oveja" ? "Ovejas" : "Conejas"}
        description={
          batchMode
            ? `Elige las ${many} y apunta la vacuna o desparasitación de una vez.`
            : `${active} ${active === 1 ? "activa" : "activas"} · ${rows.length} en total`
        }
      />
      <AnimalList
        kind={kind}
        rows={rows}
        initialQuery={sp.q ?? ""}
        initialFilter={parseFilter(sp.f)}
        presets={settings.vaccinePresets}
        batchMode={batchMode}
      />
    </div>
  );
}
