import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listProfiles } from "@/lib/queries";
import { TransferForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NuevaTransferenciaPage() {
  const profiles = await listProfiles();
  return (
    <div className="max-w-xl mx-auto py-2 pb-16">
      <Link
        href="/deudas"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown mb-4"
      >
        <ChevronLeft size={16} /> Volver a deudas
      </Link>
      <h1 className="font-serif italic text-3xl md:text-4xl font-medium mb-2">
        Registrar transferencia
      </h1>
      <p className="text-sm text-crave-brown/70 mb-7">
        Cuando una le pasa plata a otra (Mi Dinero, banco, efectivo). El sistema usa el monto
        para saldar las deudas pendientes que tengan en esa dirección. Si sobra, queda como
        crédito a favor de quien pagó.
      </p>
      <TransferForm profiles={profiles} />
    </div>
  );
}
