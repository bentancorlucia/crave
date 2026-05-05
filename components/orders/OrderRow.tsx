import Link from "next/link";
import { Truck, ShoppingBag, Calendar, ChefHat, AlertCircle } from "lucide-react";
import { formatUYU, formatRelativeDate, formatUpcomingWeekday } from "@/lib/money";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderListItem } from "@/lib/queries/pedidos";

function isUrgent(dueDate: string, status: string) {
  if (status === "entregado" || status === "cancelado") return false;
  const ymd = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!ymd) return false;
  const due = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  return diff <= 1;
}

function isOverdue(dueDate: string, status: string) {
  if (status === "entregado" || status === "cancelado") return false;
  const ymd = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!ymd) return false;
  const due = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return due.getTime() < today.getTime();
}

export function OrderRow({ order }: { order: OrderListItem }) {
  const remaining = Math.max(0, order.total_cents - order.paid_cents);
  const fullyPaid = order.paid_cents >= order.total_cents && order.total_cents > 0;
  const dueLabel = order.due_date ? formatRelativeDate(order.due_date) : null;
  const dueWeekday = order.due_date ? formatUpcomingWeekday(order.due_date) : null;
  const overdue = order.due_date ? isOverdue(order.due_date, order.status) : false;
  const urgent = order.due_date ? isUrgent(order.due_date, order.status) : false;

  const dueClass = overdue
    ? "text-crave-pink font-semibold"
    : urgent
      ? "text-crave-brown font-semibold"
      : "text-crave-brown/75";

  return (
    <Link
      href={`/pedidos/${order.id}`}
      className="block bg-crave-cream rounded-card border border-crave-brown/15 p-4 active:bg-crave-blue/40 hover:bg-crave-blue/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium leading-tight truncate">
            {order.customer_name_snapshot}
          </h3>
          <p className="text-sm text-crave-brown/85 truncate mt-0.5">
            {order.items_count > 1
              ? `${order.items_count} productos`
              : order.first_item_name ?? "—"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold tabular-nums leading-tight">
            {formatUYU(order.total_cents)}
          </p>
          {fullyPaid ? (
            <p className="text-xs text-crave-brown/60 mt-0.5">Cobrado</p>
          ) : (
            <p className="text-xs text-crave-pink font-medium tabular-nums mt-0.5">
              Falta {formatUYU(remaining)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <OrderStatusBadge status={order.status} />
        {dueLabel && (
          <span className={`inline-flex items-center gap-1 text-xs ${dueClass}`}>
            {overdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
            entrega {dueLabel}
            {dueWeekday ? ` · ${dueWeekday}` : ""}
          </span>
        )}
      </div>

      {(order.cooks.length > 0 || order.deliverers.length > 0) && (
        <div className="mt-2 flex flex-col gap-1 text-xs text-crave-brown/70">
          <span className="inline-flex items-center gap-1.5">
            {order.delivery_kind === "envio" ? (
              <Truck size={12} className="shrink-0" />
            ) : (
              <ShoppingBag size={12} className="shrink-0" />
            )}
            <span className="truncate">
              {order.delivery_kind === "envio" ? "Envío" : "Retira"}
              {order.deliverers.length > 0 &&
                `: ${order.deliverers.map((d) => d.display_name).join(", ")}`}
            </span>
          </span>
          {order.cooks.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <ChefHat size={12} className="shrink-0" />
              <span className="truncate">
                {order.cooks.map((c) => c.display_name).join(", ")}
              </span>
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
