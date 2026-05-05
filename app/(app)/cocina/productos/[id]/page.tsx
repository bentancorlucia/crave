import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getProductWithRecipe, listIngredients } from "@/lib/queries";
import { EditProductForm } from "./form";

export const dynamic = "force-dynamic";

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [productData, ingredients] = await Promise.all([
    getProductWithRecipe(id),
    listIngredients(),
  ]);
  if (!productData) notFound();

  return (
    <div className="max-w-xl mx-auto py-2 space-y-6 pb-12">
      <Link
        href="/cocina/productos"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown"
      >
        <ChevronLeft size={16} /> Volver
      </Link>

      <div>
        <h1 className="font-serif italic text-3xl md:text-4xl font-medium">
          {productData.product.name}
        </h1>
        <p className="text-sm text-crave-brown/70 mt-1">
          Editá precio, descripción y receta.
        </p>
      </div>

      <EditProductForm
        id={id}
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          unit: i.unit,
          last_unit_cost_cents: i.last_unit_cost_cents,
        }))}
        defaults={{
          name: productData.product.name,
          description: productData.product.description ?? null,
          sale_price_cents: productData.product.sale_price_cents,
          active: productData.product.active,
          recipe: productData.recipe.map((r) => ({
            ingredient_id: r.ingredient_id,
            quantity: r.quantity,
          })),
        }}
      />
    </div>
  );
}
