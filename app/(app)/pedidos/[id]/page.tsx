import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Truck, ShoppingBag, Phone, Calendar } from "lucide-react";
import { getOrderById } from "@/lib/queries";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { LowStockWarning } from "@/components/orders/LowStockWarning";
import { OrderCostSummary } from "@/components/orders/OrderCostSummary";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUYU, formatRelativeDate } from "@/lib/money";
import { StatusActions } from "./StatusActions";
import { PaymentForm } from "./PaymentForm";
import { DeleteOrderButton } from "./DeleteOrderButton";

export const dynamic = "force-dynamic";

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const data = await getOrderById(id);
  if (!data) notFound();

  const { order, items, cooks, deliverers } = data;
  const remaining = Math.max(0, order.total_cents - order.paid_cents);
  const fullyPaid = order.paid_cents >= order.total_cents && order.total_cents > 0;
  const warnings = (order.low_stock_warnings as any[]) ?? [];

  return (
    <div className="max-w-3xl mx-auto py-2 space-y-6 pb-12">
      <Link
        href="/pedidos"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown"
      >
        <ChevronLeft size={16} /> Volver
      </Link>

      {sp.error && (
        <div className="bg-crave-pink/40 border border-crave-pink rounded-card p-4 text-sm">
          {sp.error}
        </div>
      )}

      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif italic text-3xl md:text-4xl font-medium">
              {order.customer_name_snapshot}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-crave-brown/70 flex items-center gap-2 flex-wrap">
            {order.customer_contact_snapshot && (
              <span className="inline-flex items-center gap-1">
                <Phone size={12} /> {order.customer_contact_snapshot}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              {order.delivery_kind === "envio" ? <Truck size={12} /> : <ShoppingBag size={12} />}
              {order.delivery_kind === "envio" ? "Envío" : "Retira"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} /> {formatRelativeDate(order.order_date)}
              {order.due_date && (
                <> · entrega {formatRelativeDate(order.due_date)}</>
              )}
            </span>
          </p>
        </div>
      </header>

      {warnings.length > 0 && <LowStockWarning warnings={warnings} />}

      <Card className="bg-crave-cream">
        <h2 className="font-serif italic text-xl font-medium mb-3">Productos</h2>
        <ul className="divide-y divide-crave-brown/10">
          {items.map((it) => (
            <li key={it.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{it.product_name_snapshot}</p>
                <p className="text-xs text-crave-brown/60 tabular-nums">
                  {it.quantity} × {formatUYU(it.unit_price_cents)}
                  {it.cost_cents > 0 && (
                    <> · costo {formatUYU(it.cost_cents)}</>
                  )}
                </p>
              </div>
              <p className="font-semibold tabular-nums">{formatUYU(it.subtotal_cents)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-crave-brown/15 flex items-center justify-between">
          <p className="text-sm text-crave-brown/70">Total</p>
          <p className="font-serif italic text-2xl font-medium tabular-nums">
            {formatUYU(order.total_cents)}
          </p>
        </div>
      </Card>

      {(cooks.length > 0 || deliverers.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cooks.length > 0 && (
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-crave-brown/60 font-semibold mb-2">
                Cocinó
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cooks.map((c) => (
                  <Badge key={c.id} tone="blue">
                    {c.display_name}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
          {deliverers.length > 0 && (
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-crave-brown/60 font-semibold mb-2">
                Entregó / envió
              </p>
              <div className="flex flex-wrap gap-1.5">
                {deliverers.map((d) => (
                  <Badge key={d.id} tone="cream">
                    {d.display_name}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      <Card className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-serif italic text-xl font-medium">Pago</h2>
            <p className="text-xs text-crave-brown/60">
              Cobrado {formatUYU(order.paid_cents)} de {formatUYU(order.total_cents)}
              {fullyPaid && " · cobrado completo"}
            </p>
          </div>
          {fullyPaid ? (
            <Badge tone="blue">Cobrado</Badge>
          ) : (
            <Badge tone="pink">Falta {formatUYU(remaining)}</Badge>
          )}
        </div>
        {!fullyPaid && order.status !== "cancelado" && (
          <PaymentForm orderId={order.id} remainingCents={remaining} />
        )}
        {fullyPaid && order.movement_id && (
          <p className="text-xs text-crave-brown/60">
            Ingreso registrado en la cuenta madre.
          </p>
        )}
      </Card>

      {order.total_cost_cents > 0 && (
        <OrderCostSummary
          totalCents={order.total_cents}
          totalCostCents={order.total_cost_cents}
        />
      )}

      {order.notes && (
        <Card className="p-4 bg-crave-cream">
          <p className="text-xs uppercase tracking-widest text-crave-brown/60 font-semibold mb-1">
            Notas
          </p>
          <p className="text-sm text-crave-brown/85 whitespace-pre-wrap">{order.notes}</p>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="font-serif italic text-xl font-medium">Acciones</h2>
        <StatusActions orderId={order.id} status={order.status} />
        <DeleteOrderButton orderId={order.id} />
      </section>
    </div>
  );
}
