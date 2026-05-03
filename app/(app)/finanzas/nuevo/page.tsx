import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/forms/transaction-form";
import { createTransactionAction } from "@/actions/transactions";
import {
  listSheepOptions,
  listRabbitOptions,
} from "@/lib/queries/animals-select";

export const metadata = { title: "Nuevo movimiento · Acienda" };
export const dynamic = "force-dynamic";

export default async function NuevoMovimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ sheepId?: string; rabbitId?: string }>;
}) {
  const sp = await searchParams;
  const defaultSheepId = sp.sheepId ? Number(sp.sheepId) : undefined;
  const defaultRabbitId = sp.rabbitId ? Number(sp.rabbitId) : undefined;

  const [sheepOptions, rabbitOptions] = await Promise.all([
    listSheepOptions(),
    listRabbitOptions(),
  ]);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 h-8 px-2">
        <Link href="/finanzas">
          <ChevronLeft className="h-4 w-4" />
          Finanzas
        </Link>
      </Button>
      <PageHeader title="Nuevo movimiento" description="Ingreso o gasto" />
      <TransactionForm
        action={createTransactionAction}
        sheepOptions={sheepOptions}
        rabbitOptions={rabbitOptions}
        defaultSheepId={
          defaultSheepId && Number.isFinite(defaultSheepId)
            ? defaultSheepId
            : undefined
        }
        defaultRabbitId={
          defaultRabbitId && Number.isFinite(defaultRabbitId)
            ? defaultRabbitId
            : undefined
        }
        submitLabel="Guardar movimiento"
        cancelHref="/finanzas"
      />
    </div>
  );
}
