import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listIngredients } from "@/lib/queries";
import { ProductForm } from "@/components/recipes/ProductForm";
import { createProduct } from "./actions";

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const ingredients = await listIngredients();

  return (
    <div className="max-w-xl mx-auto py-2">
      <Link
        href="/cocina/productos"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown mb-4"
      >
        <ChevronLeft size={16} /> Volver
      </Link>
      <h1 className="font-serif italic text-2xl md:text-4xl font-medium mb-2">Nuevo producto</h1>
      <p className="text-sm text-crave-brown/70 mb-7">
        Cargá precio, descripción y los ingredientes que lleva. El costo se calcula automáticamente con el costo actual de los lotes (LIFO).
      </p>
      {ingredients.length === 0 && (
        <div className="bg-crave-pink/30 border border-crave-pink rounded-card p-4 mb-5 text-sm">
          No hay ingredientes cargados todavía. Vas a poder crear el producto pero sin receta.{" "}
          <Link href="/cocina/insumos/nuevo" className="font-semibold underline underline-offset-2">
            Crear ingrediente
          </Link>
          .
        </div>
      )}
      <ProductForm
        action={createProduct}
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          unit: i.unit,
          last_unit_cost_cents: i.last_unit_cost_cents,
        }))}
        submitLabel="Crear producto"
      />
    </div>
  );
}
