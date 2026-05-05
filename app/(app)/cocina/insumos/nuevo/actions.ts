"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(1, "Agregá un nombre").max(80),
  unit: z.enum(["kg", "g", "l", "ml", "unidad"]),
  low_stock_threshold: z
    .string()
    .min(1, "Indicá un umbral (0 si no querés alerta)")
    .refine((v) => !Number.isNaN(parseFloat(v.replace(",", "."))), "Número inválido"),
  note: z.string().max(200).optional().nullable(),
});

export type IngredientActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createIngredient(
  _prev: IngredientActionState,
  formData: FormData,
): Promise<IngredientActionState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    low_stock_threshold: formData.get("low_stock_threshold"),
    note: (formData.get("note") as string | null) || null,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  const threshold = parseFloat(parsed.data.low_stock_threshold.replace(",", "."));

  const { error } = await supabase.from("ingredients").insert({
    name: parsed.data.name,
    unit: parsed.data.unit,
    low_stock_threshold: threshold,
    note: parsed.data.note,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/cocina");
  revalidatePath("/cocina/insumos");
  redirect("/cocina/insumos");
}
