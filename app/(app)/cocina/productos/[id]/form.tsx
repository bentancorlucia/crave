"use client";

import { ProductForm, type ProductDefaults } from "@/components/recipes/ProductForm";
import { updateProduct, deleteProduct, type State } from "./actions";
import type { IngredientUnit } from "@/lib/queries/cocina";

export function EditProductForm({
  id,
  ingredients,
  defaults,
}: {
  id: string;
  ingredients: Array<{
    id: string;
    name: string;
    unit: IngredientUnit;
    last_unit_cost_cents: number | null;
  }>;
  defaults: ProductDefaults;
}) {
  const action = async (prev: State, formData: FormData) => updateProduct(id, prev, formData);
  const onDelete = async (_formData: FormData) => {
    await deleteProduct(id);
  };
  return (
    <ProductForm
      action={action}
      ingredients={ingredients}
      defaults={defaults}
      submitLabel="Guardar cambios"
      onDelete={onDelete}
    />
  );
}
