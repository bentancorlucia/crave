"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseToCents } from "@/lib/money";
import { getPendingDebtsBetween } from "@/lib/queries";

const schema = z
  .object({
    from_profile_id: z.string().uuid("Elegí quién paga"),
    to_profile_id: z.string().uuid("Elegí quién recibe"),
    amount: z.string().min(1, "Ingresá un monto"),
    paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    note: z.string().max(200).optional().nullable(),
  })
  .refine((v) => v.from_profile_id !== v.to_profile_id, {
    message: "Tienen que ser dos socias distintas",
    path: ["to_profile_id"],
  });

export type TransferState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createTransfer(
  _prev: TransferState,
  formData: FormData,
): Promise<TransferState> {
  const parsed = schema.safeParse({
    from_profile_id: formData.get("from_profile_id"),
    to_profile_id: formData.get("to_profile_id"),
    amount: formData.get("amount"),
    paid_on: formData.get("paid_on"),
    note: formData.get("note") || null,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { fieldErrors };
  }

  const cents = parseToCents(parsed.data.amount);
  if (!cents || cents <= 0) return { fieldErrors: { amount: "Monto inválido" } };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  // 1. Aplicar el monto a las deudas pendientes from → to (FIFO).
  const debts = await getPendingDebtsBetween(
    parsed.data.from_profile_id,
    parsed.data.to_profile_id,
  );

  let remaining = cents;
  const baseNote = parsed.data.note?.trim() || null;

  for (const d of debts) {
    if (remaining <= 0) break;
    if (d.remaining_cents <= 0) continue;
    const apply = Math.min(remaining, d.remaining_cents);
    const { error } = await supabase.from("debt_payments").insert({
      debt_id: d.id,
      amount_cents: apply,
      paid_on: parsed.data.paid_on,
      note: baseNote ?? "Transferencia entre socias",
      registered_by: user.id,
    });
    if (error) return { error: error.message };
    remaining -= apply;
  }

  // 2. Si sobró plata, queda como saldo a favor del que pagó.
  // Lo modelamos como un expense_group con un único deudor (el receptor) por el sobrante.
  if (remaining > 0) {
    const { error } = await supabase.rpc("create_expense_group", {
      p_payer: parsed.data.from_profile_id,
      p_total_cents: remaining,
      p_description: baseNote
        ? `Saldo tras transferencia · ${baseNote}`
        : "Saldo a favor tras transferencia",
      p_occurred_on: parsed.data.paid_on,
      p_participants: [parsed.data.to_profile_id],
      p_include_payer: false,
      p_note: null,
      p_created_by: user.id,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/deudas");
  redirect("/deudas");
}
