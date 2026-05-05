"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseToCents } from "@/lib/money";

const schema = z.object({
  customer_name: z.string().min(1, "Nombre del cliente").max(120),
  customer_contact: z.string().max(200).optional().nullable(),
  delivery_kind: z.enum(["envio", "retira"]),
  order_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida").optional().or(z.literal("")),
  notes: z.string().max(500).optional().nullable(),
  payment_method: z.string().max(60).optional().nullable(),
});

export type State = { error?: string; fieldErrors?: Record<string, string> };

type ParsedItem = {
  product_id: string;
  quantity: number;
  unit_price_cents: number;
};

function parseItems(formData: FormData): ParsedItem[] {
  const ids = formData.getAll("item_product_id") as string[];
  const qs = formData.getAll("item_quantity") as string[];
  const prices = formData.getAll("item_unit_price_cents") as string[];
  const out: ParsedItem[] = [];
  for (let i = 0; i < ids.length; i++) {
    const q = parseFloat((qs[i] ?? "").replace(",", "."));
    const price = parseInt(prices[i] ?? "0", 10);
    if (!ids[i] || !Number.isFinite(q) || q <= 0) continue;
    out.push({ product_id: ids[i], quantity: q, unit_price_cents: price });
  }
  return out;
}

export async function updateOrder(
  orderId: string,
  _prev: State,
  formData: FormData,
): Promise<State> {
  const parsed = schema.safeParse({
    customer_name: formData.get("customer_name"),
    customer_contact: (formData.get("customer_contact") as string | null) || null,
    delivery_kind: formData.get("delivery_kind"),
    order_date: formData.get("order_date"),
    due_date: formData.get("due_date") || undefined,
    notes: (formData.get("notes") as string | null) || null,
    payment_method: (formData.get("payment_method") as string | null) || null,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { fieldErrors };
  }

  const items = parseItems(formData);
  if (items.length === 0) {
    return { fieldErrors: { items: "El pedido tiene que tener al menos un producto" } };
  }

  const cookIds = formData.getAll("cook_id") as string[];
  const delivIds = formData.getAll("deliverer_id") as string[];
  const paidStr = (formData.get("paid") as string) ?? "";
  const paidCents = paidStr ? parseToCents(paidStr) ?? 0 : 0;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada" };

  const { data: existing } = await supabase
    .from("orders")
    .select("status, movement_id, total_cents, paid_cents")
    .eq("id", orderId)
    .single();
  if (!existing) return { error: "Pedido no encontrado" };

  if (existing.status === "realizado" || existing.status === "entregado") {
    return {
      error:
        "Este pedido ya fue confirmado. Revertilo primero (botón 'Volver a preparando') para poder editar productos y cantidades.",
    };
  }

  // resolver/crear customer
  let customerId: string | null = null;
  const trimmedName = parsed.data.customer_name.trim();
  if (trimmedName) {
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .ilike("name", trimmedName)
      .limit(1);
    if (existingCustomer?.[0]) {
      customerId = existingCustomer[0].id;
    } else {
      const { data: created } = await supabase
        .from("customers")
        .insert({
          name: trimmedName,
          contact: parsed.data.customer_contact ?? null,
          created_by: user.id,
        })
        .select("id")
        .single();
      customerId = created?.id ?? null;
    }
  }

  // snapshots de productos
  const productIds = Array.from(new Set(items.map((i) => i.product_id)));
  const { data: products } = await supabase
    .from("products")
    .select("id, name, sale_price_cents")
    .in("id", productIds);
  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  let totalCents = 0;
  const itemRows = items.map((it) => {
    const p = productById.get(it.product_id);
    const unit = p?.sale_price_cents ?? it.unit_price_cents;
    const subtotal = Math.round(it.quantity * unit);
    totalCents += subtotal;
    return {
      order_id: orderId,
      product_id: it.product_id,
      product_name_snapshot: p?.name ?? "",
      quantity: it.quantity,
      unit_price_cents: unit,
      subtotal_cents: subtotal,
    };
  });

  // reemplazar items
  await supabase.from("order_items").delete().eq("order_id", orderId);
  const { error: itemsError } = await supabase.from("order_items").insert(itemRows);
  if (itemsError) return { error: itemsError.message };

  // reemplazar cooks/deliverers
  await supabase.from("order_cooks").delete().eq("order_id", orderId);
  await supabase.from("order_deliverers").delete().eq("order_id", orderId);
  if (cookIds.length) {
    const unique = Array.from(new Set(cookIds));
    await supabase
      .from("order_cooks")
      .insert(unique.map((profile_id) => ({ order_id: orderId, profile_id })));
  }
  if (delivIds.length) {
    const unique = Array.from(new Set(delivIds));
    await supabase
      .from("order_deliverers")
      .insert(unique.map((profile_id) => ({ order_id: orderId, profile_id })));
  }

  // gestionar movement_id según paid_cents nuevo
  let movementId = existing.movement_id as string | null;
  const fullyPaid = paidCents > 0 && paidCents >= totalCents && totalCents > 0;
  if (fullyPaid && !movementId) {
    const { data: mov } = await supabase
      .from("movements")
      .insert({
        type: "ingreso",
        amount_cents: totalCents,
        description: `Pedido: ${trimmedName}`,
        category: "ventas",
        occurred_on: parsed.data.order_date,
        created_by: user.id,
      })
      .select("id")
      .single();
    movementId = mov?.id ?? null;
  } else if (fullyPaid && movementId) {
    // mantener sincronizado el ingreso si cambió el total o la fecha
    await supabase
      .from("movements")
      .update({
        amount_cents: totalCents,
        description: `Pedido: ${trimmedName}`,
        occurred_on: parsed.data.order_date,
      })
      .eq("id", movementId);
  } else if (!fullyPaid && movementId) {
    await supabase.from("movements").delete().eq("id", movementId);
    movementId = null;
  }

  // actualizar order
  const { error: updError } = await supabase
    .from("orders")
    .update({
      customer_id: customerId,
      customer_name_snapshot: trimmedName,
      customer_contact_snapshot: parsed.data.customer_contact ?? null,
      delivery_kind: parsed.data.delivery_kind,
      order_date: parsed.data.order_date,
      due_date: parsed.data.due_date || null,
      total_cents: totalCents,
      paid_cents: paidCents,
      paid_at: fullyPaid ? new Date().toISOString() : null,
      payment_method: parsed.data.payment_method ?? null,
      notes: parsed.data.notes ?? null,
      movement_id: movementId,
    })
    .eq("id", orderId);
  if (updError) return { error: updError.message };

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/dashboard");
  redirect(`/pedidos/${orderId}`);
}
