import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { TransactionForm } from "@/components/forms/transaction-form";
import { updateTransactionAction } from "@/actions/transactions";
import { getTransactionById } from "@/lib/queries/transactions";
import {
  listSheepOptions,
  listRabbitOptions,
} from "@/lib/queries/animals-select";

export const dynamic = "force-dynamic";

export default async function EditarMovimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const txId = Number(id);
  if (!Number.isFinite(txId)) notFound();
  const tx = await getTransactionById(txId);
  if (!tx) notFound();

  const [sheepOptions, rabbitOptions] = await Promise.all([
    listSheepOptions(),
    listRabbitOptions(),
  ]);

  const action = updateTransactionAction.bind(null, txId);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 h-8 px-2">
        <Link href="/finanzas">
          <ChevronLeft className="h-4 w-4" />
          Finanzas
        </Link>
      </Button>
      <PageHeader title="Editar movimiento" />
      <TransactionForm
        action={action}
        initial={tx}
        sheepOptions={sheepOptions}
        rabbitOptions={rabbitOptions}
        submitLabel="Guardar cambios"
        cancelHref="/finanzas"
      />
    </div>
  );
}
