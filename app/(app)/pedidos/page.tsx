import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { listOrders, getOrdersStats } from "@/lib/queries";
import { OrderRow } from "@/components/orders/OrderRow";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatUYU } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const validStatus = ["preparando", "realizado", "entregado", "cancelado"].includes(
    sp.status ?? "",
  )
    ? (sp.status as any)
    : undefined;

  const [orders, stats] = await Promise.all([
    listOrders({ status: validStatus, month: sp.month }),
    getOrdersStats(),
  ]);

  const filters: Array<{ key: string | undefined; label: string }> = [
    { key: undefined, label: "Todos" },
    { key: "preparando", label: "Preparando" },
    { key: "realizado", label: "Realizados" },
    { key: "entregado", label: "Entregados" },
    { key: "cancelado", label: "Cancelados" },
  ];

  return (
    <main className="space-y-8 pb-12">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif italic text-3xl md:text-4xl font-medium">Pedidos</h1>
          <p className="text-sm text-crave-brown/70 mt-1">
            Quién pidió, qué pidió y en qué estado está.
          </p>
        </div>
        <Link
          href="/pedidos/nuevo"
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          <Plus size={16} /> Nuevo
        </Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-crave-brown/60 font-semibold">
            En preparación
          </p>
          <p className="font-serif italic text-3xl font-medium tabular-nums mt-1">
            {stats.preparando}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-crave-brown/60 font-semibold">
            Para hoy o mañana
          </p>
          <p className="font-serif italic text-3xl font-medium tabular-nums mt-1">{stats.dueSoon}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-crave-brown/60 font-semibold">
            Sin cobrar
          </p>
          <p className="font-serif italic text-3xl font-medium tabular-nums mt-1">
            {formatUYU(stats.unpaidCents, { compact: true })}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = (sp.status ?? undefined) === f.key;
          const href = f.key ? `/pedidos?status=${f.key}` : "/pedidos";
          return (
            <Link
              key={f.label}
              href={href}
              className={
                active
                  ? "inline-flex items-center h-9 px-4 rounded-full text-sm font-semibold bg-crave-pink text-crave-brown shadow-soft"
                  : "inline-flex items-center h-9 px-4 rounded-full text-sm font-medium bg-crave-cream border border-crave-brown/15 text-crave-brown/70 hover:text-crave-brown"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-crave-brown/60">
          <ClipboardList size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay pedidos con esos filtros.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id}>
              <OrderRow order={o} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
