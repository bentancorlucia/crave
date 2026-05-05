"use client";

import { IngredientForm, type IngredientDefaults } from "@/components/recipes/IngredientForm";
import { updateIngredient, deleteIngredient, type State } from "./actions";

export function EditIngredientForm({
  id,
  defaults,
}: {
  id: string;
  defaults: IngredientDefaults;
}) {
  const action = async (prev: State, formData: FormData) => updateIngredient(id, prev, formData);
  const onDelete = async (_formData: FormData) => {
    await deleteIngredient(id);
  };
  return (
    <IngredientForm
      action={action}
      defaults={defaults}
      submitLabel="Guardar cambios"
      onDelete={onDelete}
    />
  );
}
