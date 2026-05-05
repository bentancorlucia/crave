"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseToCents } from "@/lib/money";

const schema = z.object({
  ingredient_id: z.string().uuid(),
  quantity: z.string().min(1, "Ingresá la cantidad"),
  total_cost: z.string().min(1, "Ingresá el costo"),
  purchased_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  note: z.string().max(200).optional().nullable(),
  create_movement: z.boolean(),
});

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function createPurchase(_prev: State, formData: FormData): Promise<State> {
  const parsed = schema.safeParse({
    ingredient_id: formData.get("ingredient_id"),
    quantity: formData.get("quantity"),
    total_cost: formData.get("total_cost"),
    purchased_on: formData.get("purchased_on"),
    note: (formData.get("note") as string | null) || null,
    create_movement: formData.get("create_movement") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { fieldErrors };
  }

  const quantity = parseFloat(parsed.data.quantity.replace(",", "."));
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { fieldErrors: { quantity: "Cantidad inválida" } };
  }
  const totalCostCents = parseToCents(parsed.data.total_cost);
  if (!totalCostCents || totalCostCents < 0) {
    return { fieldErrors: { total_cost: "Costo inválido" } };
  }
  const unitCostCents = Math.round(totalCostCents / quantity);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  const { data: ing } = await supabase
    .from("ingredients")
    .select("name")
    .eq("id", parsed.data.ingredient_id)
    .single();
  if (!ing) return { error: "Ingrediente no encontrado" };

  let movementId: string | null = null;
  if (parsed.data.create_movement) {
    const { data: mov, error: movError } = await supabase
      .from("movements")
      .insert({
        type: "egreso",
        amount_cents: totalCostCents,
        description: `Compra: ${ing.name}`,
        category: "insumos",
        occurred_on: parsed.data.purchased_on,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (movError) return { error: movError.message };
    movementId = mov?.id ?? null;
  }

  const { error } = await supabase.from("ingredient_purchases").insert({
    ingredient_id: parsed.data.ingredient_id,
    quantity_purchased: quantity,
    quantity_remaining: quantity,
    total_cost_cents: totalCostCents,
    unit_cost_cents: unitCostCents,
    purchased_on: parsed.data.purchased_on,
    movement_id: movementId,
    registered_by: user.id,
    note: parsed.data.note,
  });
  if (error) {
    if (movementId) {
      await supabase.from("movements").delete().eq("id", movementId);
    }
    return { error: error.message };
  }

  revalidatePath("/cocina");
  revalidatePath("/cocina/insumos");
  revalidatePath(`/cocina/insumos/${parsed.data.ingredient_id}`);
  revalidatePath("/dashboard");
  redirect(`/cocina/insumos/${parsed.data.ingredient_id}`);
}
