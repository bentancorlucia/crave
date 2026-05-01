import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listProfiles, getCurrentProfile } from "@/lib/queries";
import { NewExpenseGroupForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NuevoGastoCompartidoPage() {
  const [profiles, current] = await Promise.all([listProfiles(), getCurrentProfile()]);

  return (
    <div className="max-w-xl mx-auto py-2 pb-16">
      <Link
        href="/deudas"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown mb-4"
      >
        <ChevronLeft size={16} /> Volver a deudas
      </Link>
      <h1 className="font-serif italic text-2xl md:text-4xl font-medium mb-2">
        Nuevo gasto compartido
      </h1>
      <p className="text-sm text-crave-brown/70 mb-7">
        Una socia puso plata por algo que se reparte entre varias. Elegí quiénes participan y se
        generan las deudas automáticamente.
      </p>
      <NewExpenseGroupForm profiles={profiles} currentProfileId={current?.id ?? null} />
    </div>
  );
}
