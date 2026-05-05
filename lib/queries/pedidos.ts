import { createClient } from "@/lib/supabase/server";

export type OrderStatus = "preparando" | "realizado" | "entregado" | "cancelado";
export type OrderDeliveryKind = "envio" | "retira";

export type OrderListItem = {
  id: string;
  customer_name_snapshot: string;
  customer_contact_snapshot: string | null;
  status: OrderStatus;
  delivery_kind: OrderDeliveryKind;
  order_date: string;
  due_date: string | null;
  total_cents: number;
  total_cost_cents: number;
  paid_cents: number;
  paid_at: string | null;
  notes: string | null;
  cooks: Array<{ id: string; display_name: string; initial: string }>;
  deliverers: Array<{ id: string; display_name: string; initial: string }>;
  items_count: number;
  first_item_name: string | null;
};

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return (v ?? null) as T | null;
}

export async function listOrders(
  filter: { status?: OrderStatus; month?: string; cookId?: string } = {},
  limit = 100,
): Promise<OrderListItem[]> {
  const supabase = await createClient();
  let q = supabase
    .from("orders")
    .select(
      `id, customer_name_snapshot, customer_contact_snapshot, status, delivery_kind,
       order_date, due_date, total_cents, total_cost_cents, paid_cents, paid_at, notes`,
    )
    .order("order_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (filter.status) q = q.eq("status", filter.status);
  if (filter.month) {
    const [y, m] = filter.month.split("-").map(Number);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
    q = q.gte("order_date", start).lt("order_date", next);
  }
  const { data, error } = await q;
  if (error) throw error;
  if (!data?.length) return [];

  const ids = data.map((o) => o.id);

  const [{ data: cooksRows }, { data: delivRows }, { data: itemsRows }] = await Promise.all([
    supabase
      .from("order_cooks")
      .select(`order_id, profile:profiles!order_cooks_profile_id_fkey(id, display_name, initial)`)
      .in("order_id", ids),
    supabase
      .from("order_deliverers")
      .select(
        `order_id, profile:profiles!order_deliverers_profile_id_fkey(id, display_name, initial)`,
      )
      .in("order_id", ids),
    supabase
      .from("order_items")
      .select("order_id, product_name_snapshot, created_at")
      .in("order_id", ids)
      .order("created_at", { ascending: true }),
  ]);

  const cooksByOrder = new Map<string, OrderListItem["cooks"]>();
  (cooksRows ?? []).forEach((r: any) => {
    const arr = cooksByOrder.get(r.order_id) ?? [];
    const p = Array.isArray(r.profile) ? r.profile[0] : r.profile;
    if (p) arr.push(p);
    cooksByOrder.set(r.order_id, arr);
  });
  const delivByOrder = new Map<string, OrderListItem["deliverers"]>();
  (delivRows ?? []).forEach((r: any) => {
    const arr = delivByOrder.get(r.order_id) ?? [];
    const p = Array.isArray(r.profile) ? r.profile[0] : r.profile;
    if (p) arr.push(p);
    delivByOrder.set(r.order_id, arr);
  });
  const itemsCount = new Map<string, number>();
  const firstItemName = new Map<string, string>();
  (itemsRows ?? []).forEach((r: any) => {
    itemsCount.set(r.order_id, (itemsCount.get(r.order_id) ?? 0) + 1);
    if (!firstItemName.has(r.order_id) && r.product_name_snapshot) {
      firstItemName.set(r.order_id, r.product_name_snapshot);
    }
  });

  let result: OrderListItem[] = data.map((o) => ({
    id: o.id as string,
    customer_name_snapshot: o.customer_name_snapshot as string,
    customer_contact_snapshot: (o.customer_contact_snapshot as string | null) ?? null,
    status: o.status as OrderStatus,
    delivery_kind: o.delivery_kind as OrderDeliveryKind,
    order_date: o.order_date as string,
    due_date: (o.due_date as string | null) ?? null,
    total_cents: Number(o.total_cents),
    total_cost_cents: Number(o.total_cost_cents),
    paid_cents: Number(o.paid_cents),
    paid_at: (o.paid_at as string | null) ?? null,
    notes: (o.notes as string | null) ?? null,
    cooks: cooksByOrder.get(o.id) ?? [],
    deliverers: delivByOrder.get(o.id) ?? [],
    items_count: itemsCount.get(o.id) ?? 0,
    first_item_name: firstItemName.get(o.id) ?? null,
  }));

  if (filter.cookId) {
    result = result.filter((o) => o.cooks.some((c) => c.id === filter.cookId));
  }

  return result;
}

export async function getOrdersStats() {
  const supabase = await createClient();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  const [{ count: preparandoCount }, { count: hoyCount }, { data: pendingPayments }] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "preparando"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .lte("due_date", tomorrowStr)
      .gte("due_date", todayStr)
      .neq("status", "cancelado"),
    supabase
      .from("orders")
      .select("total_cents, paid_cents")
      .neq("status", "cancelado"),
  ]);

  const unpaidCents = (pendingPayments ?? []).reduce(
    (acc, o: any) => acc + Math.max(0, Number(o.total_cents) - Number(o.paid_cents)),
    0,
  );

  return {
    preparando: preparandoCount ?? 0,
    dueSoon: hoyCount ?? 0,
    unpaidCents,
  };
}

export async function getOrderById(id: string) {
  const supabase = await createClient();
  const { data: orderRaw } = await supabase
    .from("orders")
    .select(
      `id, customer_id, customer_name_snapshot, customer_contact_snapshot, status, delivery_kind,
       order_date, due_date, total_cents, total_cost_cents, paid_cents, paid_at, payment_method,
       movement_id, low_stock_warnings, notes, created_at,
       created_by_profile:profiles!orders_created_by_fkey ( display_name, initial )`,
    )
    .eq("id", id)
    .single();
  if (!orderRaw) return null;

  const [{ data: items }, { data: cooks }, { data: deliv }] = await Promise.all([
    supabase
      .from("order_items")
      .select(
        `id, product_id, product_name_snapshot, quantity, unit_price_cents, subtotal_cents, cost_cents`,
      )
      .eq("order_id", id)
      .order("created_at"),
    supabase
      .from("order_cooks")
      .select(`profile:profiles!order_cooks_profile_id_fkey(id, display_name, initial)`)
      .eq("order_id", id),
    supabase
      .from("order_deliverers")
      .select(`profile:profiles!order_deliverers_profile_id_fkey(id, display_name, initial)`)
      .eq("order_id", id),
  ]);

  return {
    order: {
      ...(orderRaw as any),
      total_cents: Number((orderRaw as any).total_cents),
      total_cost_cents: Number((orderRaw as any).total_cost_cents),
      paid_cents: Number((orderRaw as any).paid_cents),
      created_by_profile: unwrap((orderRaw as any).created_by_profile),
    },
    items: (items ?? []).map((it: any) => ({
      ...it,
      quantity: Number(it.quantity),
      unit_price_cents: Number(it.unit_price_cents),
      subtotal_cents: Number(it.subtotal_cents),
      cost_cents: Number(it.cost_cents),
    })),
    cooks: (cooks ?? [])
      .map((r: any) => unwrap(r.profile))
      .filter(Boolean) as Array<{ id: string; display_name: string; initial: string }>,
    deliverers: (deliv ?? [])
      .map((r: any) => unwrap(r.profile))
      .filter(Boolean) as Array<{ id: string; display_name: string; initial: string }>,
  };
}

export async function listCustomers(searchTerm?: string) {
  const supabase = await createClient();
  let q = supabase.from("customers").select("id, name, contact, notes").order("name").limit(50);
  if (searchTerm) q = q.ilike("name", `%${searchTerm}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getPendingOrdersForDashboard(limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `id, customer_name_snapshot, status, due_date, order_date, total_cents, paid_cents, delivery_kind`,
    )
    .in("status", ["preparando", "realizado"])
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("order_date", { ascending: true })
    .limit(limit);
  return (data ?? []).map((o: any) => ({
    id: o.id as string,
    customer_name_snapshot: o.customer_name_snapshot as string,
    status: o.status as OrderStatus,
    due_date: (o.due_date as string | null) ?? null,
    order_date: o.order_date as string,
    total_cents: Number(o.total_cents),
    paid_cents: Number(o.paid_cents),
    delivery_kind: o.delivery_kind as OrderDeliveryKind,
  }));
}
