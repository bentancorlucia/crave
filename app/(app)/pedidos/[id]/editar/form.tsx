"use client";

import { OrderForm, type OrderDefaults } from "@/components/orders/OrderForm";
import { updateOrder, type State } from "./actions";

export function EditOrderForm({
  orderId,
  products,
  profiles,
  customers,
  defaults,
}: {
  orderId: string;
  products: Array<{ id: string; name: string; sale_price_cents: number; active: boolean }>;
  profiles: Array<{ id: string; display_name: string; initial: string }>;
  customers: Array<{ id: string; name: string; contact: string | null }>;
  defaults: OrderDefaults;
}) {
  const action = async (prev: State, formData: FormData) => updateOrder(orderId, prev, formData);
  return (
    <OrderForm
      action={action}
      products={products}
      profiles={profiles}
      customers={customers}
      defaults={defaults}
      submitLabel="Guardar cambios"
    />
  );
}
