"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseToCents } from "@/lib/money";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function confirmOrder(orderId: string) {
  const { supabase, userId } = await getUserId();
  if (!userId) redirect("/login");

  const { error } = await supabase.rpc("confirm_order", {
    p_order_id: orderId,
    p_registered_by: userId,
  });
  if (error) {
    redirect(`/pedidos/${orderId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/cocina");
  revalidatePath("/cocina/insumos");
  revalidatePath("/dashboard");
  redirect(`/pedidos/${orderId}`);
}

export async function markDelivered(orderId: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase
    .from("orders")
    .update({ status: "entregado" })
    .eq("id", orderId)
    .eq("status", "realizado");
  if (error) {
    redirect(`/pedidos/${orderId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/dashboard");
  redirect(`/pedidos/${orderId}`);
}

export async function revertConfirmation(orderId: string) {
  const { supabase } = await getUserId();
  const { error: rerror } = await supabase.rpc("revert_order", { p_order_id: orderId });
  if (rerror) {
    redirect(`/pedidos/${orderId}?error=${encodeURIComponent(rerror.message)}`);
  }
  const { error } = await supabase
    .from("orders")
    .update({ status: "preparando" })
    .eq("id", orderId);
  if (error) {
    redirect(`/pedidos/${orderId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/cocina");
  revalidatePath("/cocina/insumos");
  revalidatePath("/dashboard");
  redirect(`/pedidos/${orderId}`);
}

export async function cancelOrder(orderId: string) {
  const { supabase } = await getUserId();

  const { data: order } = await supabase
    .from("orders")
    .select("status, movement_id")
    .eq("id", orderId)
    .single();
  if (!order) redirect("/pedidos");

  if (order.status === "realizado" || order.status === "entregado") {
    await supabase.rpc("revert_order", { p_order_id: orderId });
  }
  if (order.movement_id) {
    await supabase.from("movements").delete().eq("id", order.movement_id);
  }
  await supabase
    .from("orders")
    .update({ status: "cancelado", movement_id: null })
    .eq("id", orderId);

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/cocina");
  revalidatePath("/cocina/insumos");
  revalidatePath("/dashboard");
  redirect(`/pedidos/${orderId}`);
}

export async function deleteOrder(orderId: string) {
  const { supabase } = await getUserId();
  const { data: order } = await supabase
    .from("orders")
    .select("status, movement_id")
    .eq("id", orderId)
    .single();
  if (order) {
    if (order.status === "realizado" || order.status === "entregado") {
      await supabase.rpc("revert_order", { p_order_id: orderId });
    }
    if (order.movement_id) {
      await supabase.from("movements").delete().eq("id", order.movement_id);
    }
  }
  await supabase.from("orders").delete().eq("id", orderId);
  revalidatePath("/pedidos");
  revalidatePath("/cocina");
  revalidatePath("/cocina/insumos");
  revalidatePath("/dashboard");
  redirect("/pedidos");
}

export async function registerPayment(orderId: string, formData: FormData) {
  const { supabase, userId } = await getUserId();
  if (!userId) redirect("/login");

  const amountStr = formData.get("amount") as string | null;
  const cents = amountStr ? parseToCents(amountStr) : null;
  if (!cents || cents <= 0) {
    redirect(`/pedidos/${orderId}?error=${encodeURIComponent("Monto inválido")}`);
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      "total_cents, paid_cents, customer_name_snapshot, order_date, movement_id, status",
    )
    .eq("id", orderId)
    .single();
  if (!order) redirect("/pedidos");
  if (order.status === "cancelado") {
    redirect(`/pedidos/${orderId}?error=${encodeURIComponent("El pedido está cancelado")}`);
  }

  const newPaid = Number(order.paid_cents) + (cents ?? 0);
  const fullyPaid = newPaid >= Number(order.total_cents) && Number(order.total_cents) > 0;

  // crear ingreso si se completa el pago y aún no había uno
  let movementId = order.movement_id as string | null;
  if (fullyPaid && !movementId) {
    const { data: mov } = await supabase
      .from("movements")
      .insert({
        type: "ingreso",
        amount_cents: Number(order.total_cents),
        description: `Pedido: ${order.customer_name_snapshot}`,
        category: "ventas",
        occurred_on: order.order_date,
        created_by: userId,
      })
      .select("id")
      .single();
    movementId = mov?.id ?? null;
  }

  await supabase
    .from("orders")
    .update({
      paid_cents: newPaid,
      paid_at: fullyPaid ? new Date().toISOString() : null,
      movement_id: movementId,
    })
    .eq("id", orderId);

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/dashboard");
  redirect(`/pedidos/${orderId}`);
}
