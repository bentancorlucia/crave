"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseToCents } from "@/lib/money";

const schema = z.object({
  type: z.enum(["ingreso", "egreso"]),
  amount: z.string().min(1, "Ingresá un monto"),
  description: z.string().min(1, "Agregá una descripción").max(200),
  category: z.string().max(60).optional().nullable(),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
});

export type CreateMovementState = { error?: string; fieldErrors?: Record<string, string> };

export async function createMovement(
  _prev: CreateMovementState,
  formData: FormData,
): Promise<CreateMovementState> {
  const parsed = schema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    category: formData.get("category") || null,
    occurred_on: formData.get("occurred_on"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { fieldErrors };
  }

  const cents = parseToCents(parsed.data.amount);
  if (!cents || cents <= 0) {
    return { fieldErrors: { amount: "Monto inválido" } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  const { error } = await supabase.from("movements").insert({
    type: parsed.data.type,
    amount_cents: cents,
    description: parsed.data.description,
    category: parsed.data.category,
    occurred_on: parsed.data.occurred_on,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/movimientos");
  redirect("/dashboard");
}
