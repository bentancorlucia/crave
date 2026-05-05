import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listIngredients } from "@/lib/queries";
import { IngredientPurchaseForm } from "@/components/recipes/IngredientPurchaseForm";
import { createPurchase } from "./actions";

export const dynamic = "force-dynamic";

export default async function NuevaCompraPage({
  searchParams,
}: {
  searchParams: Promise<{ ingredient?: string }>;
}) {
  const { ingredient } = await searchParams;
  const ingredients = await listIngredients();

  if (ingredients.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-2">
        <Link
          href="/cocina"
          className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown mb-4"
        >
          <ChevronLeft size={16} /> Volver
        </Link>
        <h1 className="font-serif italic text-2xl md:text-4xl font-medium mb-4">
          Registrar compra
        </h1>
        <div className="bg-crave-pink/30 border border-crave-pink rounded-card p-5 text-sm">
          Primero tenés que crear al menos un ingrediente.{" "}
          <Link
            href="/cocina/insumos/nuevo"
            className="font-semibold underline underline-offset-2"
          >
            Crear ahora
          </Link>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-2">
      <Link
        href={ingredient ? `/cocina/insumos/${ingredient}` : "/cocina"}
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown mb-4"
      >
        <ChevronLeft size={16} /> Volver
      </Link>
      <h1 className="font-serif italic text-2xl md:text-4xl font-medium mb-2">
        Registrar compra
      </h1>
      <p className="text-sm text-crave-brown/70 mb-7">
        Cada compra se guarda como un lote con su costo unitario. Al cocinar, el stock se descuenta del lote más reciente primero (LIFO).
      </p>
      <IngredientPurchaseForm
        action={createPurchase}
        ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
        preselectedIngredientId={ingredient}
      />
    </div>
  );
}
