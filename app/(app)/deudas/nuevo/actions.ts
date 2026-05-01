"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseToCents } from "@/lib/money";

const schema = z.object({
  payer_profile_id: z.string().uuid("Elegí quién pagó"),
  total_amount: z.string().min(1, "Ingresá el monto"),
  description: z.string().min(1, "Agregá una descripción").max(200),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  participant_ids: z.array(z.string().uuid()).min(1, "Elegí al menos una participante"),
  include_payer: z.boolean(),
  note: z.string().max(200).optional().nullable(),
});

export type CreateExpenseGroupState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createExpenseGroup(
  _prev: CreateExpenseGroupState,
  formData: FormData,
): Promise<CreateExpenseGroupState> {
  const participant_ids = formData.getAll("participant_ids").map(String).filter(Boolean);
  const include_payer = formData.get("include_payer") === "on";

  const parsed = schema.safeParse({
    payer_profile_id: formData.get("payer_profile_id"),
    total_amount: formData.get("total_amount"),
    description: formData.get("description"),
    occurred_on: formData.get("occurred_on"),
    participant_ids,
    include_payer,
    note: formData.get("note") || null,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { fieldErrors };
  }

  const cents = parseToCents(parsed.data.total_amount);
  if (!cents || cents <= 0) {
    return { fieldErrors: { total_amount: "Monto inválido" } };
  }

  // Validar que haya al menos un deudor (alguna participante distinta del pagador)
  const others = parsed.data.participant_ids.filter((id) => id !== parsed.data.payer_profile_id);
  if (others.length === 0) {
    return {
      fieldErrors: {
        participant_ids: "Tiene que haber al menos una socia distinta del pagador",
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  const { data: newId, error } = await supabase.rpc("create_expense_group", {
    p_payer: parsed.data.payer_profile_id,
    p_total_cents: cents,
    p_description: parsed.data.description,
    p_occurred_on: parsed.data.occurred_on,
    p_participants: parsed.data.participant_ids,
    p_include_payer: parsed.data.include_payer,
    p_note: parsed.data.note,
    p_created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/deudas");
  redirect(`/deudas/${newId}`);
}
