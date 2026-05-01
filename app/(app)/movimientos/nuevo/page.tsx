import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NewMovementForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NuevoMovimientoPage() {
  return (
    <div className="max-w-xl mx-auto py-2">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown mb-4"
      >
        <ChevronLeft size={16} /> Volver
      </Link>
      <h1 className="font-serif italic text-3xl md:text-4xl font-medium mb-2">
        Registrar movimiento
      </h1>
      <p className="text-sm text-crave-brown/70 mb-7">
        Cargá un ingreso (venta) o un egreso (gasto) de la cuenta madre del negocio.
      </p>
      <NewMovementForm />
    </div>
  );
}
