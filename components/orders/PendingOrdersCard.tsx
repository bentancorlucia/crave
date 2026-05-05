import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatUYU, formatRelativeDate } from "@/lib/money";

type Pending = {
  id: string;
  customer_name_snapshot: string;
  status: "preparando" | "realizado" | "entregado" | "cancelado";
  due_date: string | null;
  order_date: string;
  total_cents: number;
  paid_cents: number;
  delivery_kind: "envio" | "retira";
};

export function PendingOrdersCard({ orders }: { orders: Pending[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList size={14} /> Pedidos pendientes
        </CardTitle>
        <Link
          href="/pedidos"
          className="text-xs font-medium opacity-60 hover:opacity-100 hover:text-crave-pink"
        >
          Ver todos →
        </Link>
      </CardHeader>
      {orders.length === 0 ? (
        <p className="text-sm text-crave-brown/70 text-center py-4">
          No hay pedidos en preparación.
        </p>
      ) : (
        <ul className="divide-y divide-crave-brown/10">
          {orders.map((o) => {
            const remaining = Math.max(0, o.total_cents - o.paid_cents);
            return (
              <li key={o.id}>
                <Link
                  href={`/pedidos/${o.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-crave-brown/5 rounded-xl px-2 -mx-2 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{o.customer_name_snapshot}</p>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="text-xs text-crave-brown/60">
                      {o.due_date
                        ? `entrega ${formatRelativeDate(o.due_date)}`
                        : `pedido ${formatRelativeDate(o.order_date)}`}
                      {remaining > 0 && (
                        <> · falta cobrar {formatUYU(remaining, { compact: true })}</>
                      )}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-crave-brown/40 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
