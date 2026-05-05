"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseToCents } from "@/lib/money";

const schema = z.object({
  name: z.string().min(1, "Agregá un nombre").max(80),
  description: z.string().max(500).optional().nullable(),
  sale_price: z.string().min(1, "Ingresá el precio"),
  active: z.boolean(),
});

export type State = { error?: string; fieldErrors?: Record<string, string> };

function parseRecipe(formData: FormData): Array<{ ingredient_id: string; quantity: number }> {
  const ids = formData.getAll("recipe_ingredient_id") as string[];
  const qs = formData.getAll("recipe_quantity") as string[];
  const out: Array<{ ingredient_id: string; quantity: number }> = [];
  for (let i = 0; i < ids.length; i++) {
    const q = parseFloat((qs[i] ?? "").replace(",", "."));
    if (!ids[i] || !Number.isFinite(q) || q <= 0) continue;
    out.push({ ingredient_id: ids[i], quantity: q });
  }
  return out;
}

export async function createProduct(_prev: State, formData: FormData): Promise<State> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    description: (formData.get("description") as string | null) || null,
    sale_price: formData.get("sale_price"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { fieldErrors };
  }

  const priceCents = parseToCents(parsed.data.sale_price);
  if (priceCents == null || priceCents < 0) {
    return { fieldErrors: { sale_price: "Precio inválido" } };
  }

  const recipe = parseRecipe(formData);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description,
      sale_price_cents: priceCents,
      active: parsed.data.active,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !product) return { error: error?.message ?? "Error al crear producto" };

  if (recipe.length > 0) {
    const { error: recipeError } = await supabase.from("recipes").insert(
      recipe.map((r) => ({
        product_id: product.id,
        ingredient_id: r.ingredient_id,
        quantity: r.quantity,
      })),
    );
    if (recipeError) {
      await supabase.from("products").delete().eq("id", product.id);
      return { error: recipeError.message };
    }
  }

  revalidatePath("/cocina");
  revalidatePath("/cocina/productos");
  redirect(`/cocina/productos/${product.id}`);
}
