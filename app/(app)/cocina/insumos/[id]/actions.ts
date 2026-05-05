"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(1).max(80),
  low_stock_threshold: z
    .string()
    .refine((v) => !Number.isNaN(parseFloat(v.replace(",", "."))), "Número inválido"),
  note: z.string().max(200).optional().nullable(),
});

export type State = { error?: string; fieldErrors?: Record<string, string> };

export async function updateIngredient(
  id: string,
  _prev: State,
  formData: FormData,
): Promise<State> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
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
  const { error } = await supabase
    .from("ingredients")
    .update({
      name: parsed.data.name,
      low_stock_threshold: parseFloat(parsed.data.low_stock_threshold.replace(",", ".")),
      note: parsed.data.note,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cocina");
  revalidatePath("/cocina/insumos");
  revalidatePath(`/cocina/insumos/${id}`);
  redirect(`/cocina/insumos/${id}`);
}

export async function deleteIngredient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) {
    redirect(`/cocina/insumos/${id}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/cocina");
  revalidatePath("/cocina/insumos");
  redirect("/cocina/insumos");
}
