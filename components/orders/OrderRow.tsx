import Link from "next/link";
import { Truck, ShoppingBag, ChevronRight } from "lucide-react";
import { formatUYU, formatRelativeDate, formatUpcomingWeekday } from "@/lib/money";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderListItem } from "@/lib/queries/pedidos";

export function OrderRow({ order }: { order: OrderListItem }) {
  const remaining = Math.max(0, order.total_cents - order.paid_cents);
  const fullyPaid = order.paid_cents >= order.total_cents && order.total_cents > 0;
  const dueLabel = order.due_date ? formatRelativeDate(order.due_date) : null;
  const dueWeekday = order.due_date ? formatUpcomingWeekday(order.due_date) : null;

  return (
    <Link
      href={`/pedidos/${order.id}`}
      className="block bg-crave-cream rounded-card border border-crave-brown/15 p-4 hover:bg-crave-blue/30 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{order.customer_name_snapshot}</h3>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-crave-brown/85 truncate">
            {order.items_count > 1
              ? "más de un producto"
              : order.first_item_name ?? "—"}
          </p>
          <p className="text-xs text-crave-brown/70 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1">
              {order.delivery_kind === "envio" ? <Truck size={12} /> : <ShoppingBag size={12} />}
              {order.delivery_kind === "envio" ? "Envío" : "Retira"}
            </span>
            {dueLabel && (
              <>
                <span>·</span>
                <span>entrega {dueLabel}{dueWeekday ? ` (${dueWeekday})` : ""}</span>
              </>
            )}
            {order.cooks.length > 0 && (
              <>
                <span>·</span>
                <span>cocina: {order.cooks.map((c) => c.initial).join(", ")}</span>
              </>
            )}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-semibold tabular-nums">{formatUYU(order.total_cents)}</p>
          <p className="text-xs tabular-nums">
            {fullyPaid ? (
              <span className="text-crave-brown/60">Cobrado</span>
            ) : (
              <span className="text-crave-pink font-medium">
                Falta {formatUYU(remaining)}
              </span>
            )}
          </p>
        </div>

        <ChevronRight size={16} className="text-crave-brown/40 shrink-0" />
      </div>
    </Link>
  );
}
