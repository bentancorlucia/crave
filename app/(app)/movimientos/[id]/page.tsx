import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getMovementById } from "@/lib/queries";
import { MovementForm } from "@/components/finance/MovementForm";
import { updateMovement, deleteMovement } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditarMovimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movement = await getMovementById(id);
  if (!movement) notFound();

  const update = updateMovement.bind(null, id);
  const remove = deleteMovement.bind(null, id);

  return (
    <div className="max-w-xl mx-auto py-2 pb-16">
      <Link
        href="/movimientos"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown mb-4"
      >
        <ChevronLeft size={16} /> Volver
      </Link>
      <h1 className="font-serif italic text-2xl md:text-4xl font-medium mb-2">
        Editar movimiento
      </h1>
      <p className="text-sm text-crave-brown/70 mb-7">
        Cambiá lo que necesites del movimiento de la cuenta madre.
      </p>
      <MovementForm
        action={update}
        defaults={{
          type: movement.type,
          amount_cents: movement.amount_cents,
          description: movement.description,
          category: movement.category,
          occurred_on: movement.occurred_on,
        }}
        submitLabel="Guardar cambios"
        onDelete={remove}
      />
    </div>
  );
}
