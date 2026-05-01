"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseToCents } from "@/lib/money";

const paymentSchema = z.object({
  debt_id: z.string().uuid(),
  group_id: z.string().uuid(),
  amount: z.string().min(1),
  paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(200).optional().nullable(),
});

export type AddPaymentState = { error?: string; fieldErrors?: Record<string, string> };

export async function addDebtPayment(
  _prev: AddPaymentState,
  formData: FormData,
): Promise<AddPaymentState> {
  const parsed = paymentSchema.safeParse({
    debt_id: formData.get("debt_id"),
    group_id: formData.get("group_id"),
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

  const { error } = await supabase.from("debt_payments").insert({
    debt_id: parsed.data.debt_id,
    amount_cents: cents,
    paid_on: parsed.data.paid_on,
    note: parsed.data.note,
    registered_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/deudas");
  revalidatePath(`/deudas/${parsed.data.group_id}`);
  redirect(`/deudas/${parsed.data.group_id}`);
}

export async function deleteDebtPayment(
  paymentId: string,
  groupId: string,
  _formData: FormData,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("debt_payments").delete().eq("id", paymentId);
  revalidatePath("/dashboard");
  revalidatePath("/deudas");
  revalidatePath(`/deudas/${groupId}`);
}

export async function deleteExpenseGroup(groupId: string, _formData: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from("expense_groups").delete().eq("id", groupId);
  revalidatePath("/dashboard");
  revalidatePath("/deudas");
  redirect("/deudas");
}
