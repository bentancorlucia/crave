"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseToCents } from "@/lib/money";

const schema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  sale_price: z.string().min(1),
  active: z.boolean(),
});

export type State = { error?: string; fieldErrors?: Record<string, string> };

function parseRecipe(formData: FormData) {
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

export async function updateProduct(id: string, _prev: State, formData: FormData): Promise<State> {
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      sale_price_cents: priceCents,
      active: parsed.data.active,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  const newRecipe = parseRecipe(formData);
  await supabase.from("recipes").delete().eq("product_id", id);
  if (newRecipe.length) {
    const { error: rerror } = await supabase.from("recipes").insert(
      newRecipe.map((r) => ({
        product_id: id,
        ingredient_id: r.ingredient_id,
        quantity: r.quantity,
      })),
    );
    if (rerror) return { error: rerror.message };
  }

  revalidatePath("/cocina");
  revalidatePath("/cocina/productos");
  revalidatePath(`/cocina/productos/${id}`);
  redirect(`/cocina/productos/${id}`);
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    redirect(`/cocina/productos/${id}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/cocina");
  revalidatePath("/cocina/productos");
  redirect("/cocina/productos");
}
