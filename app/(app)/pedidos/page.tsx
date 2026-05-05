import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { listOrders, getOrdersStats } from "@/lib/queries";
import { OrderRow } from "@/components/orders/OrderRow";
import { Card } from "@/components/ui/card";
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
    <main className="space-y-6 pb-24 md:pb-12">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif italic text-3xl md:text-4xl font-medium">Pedidos</h1>
          <p className="text-sm text-crave-brown/70 mt-1">
            Quién pidió, qué pidió y en qué estado está.
          </p>
        </div>
        <Link
          href="/pedidos/nuevo"
          className={`${buttonVariants({ variant: "primary", size: "md" })} hidden lg:inline-flex`}
        >
          <Plus size={16} /> Nuevo
        </Link>
      </header>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-crave-brown/60 font-semibold leading-tight">
            En preparación
          </p>
          <p className="font-serif italic text-2xl sm:text-3xl font-medium tabular-nums mt-1">
            {stats.preparando}
          </p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-crave-brown/60 font-semibold leading-tight">
            Hoy / mañana
          </p>
          <p className="font-serif italic text-2xl sm:text-3xl font-medium tabular-nums mt-1">
            {stats.dueSoon}
          </p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-crave-brown/60 font-semibold leading-tight">
            Sin cobrar
          </p>
          <p className="font-serif italic text-2xl sm:text-3xl font-medium tabular-nums mt-1">
            {formatUYU(stats.unpaidCents, { compact: true })}
          </p>
        </Card>
      </div>

      <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 w-max">
          {filters.map((f) => {
            const active = (sp.status ?? undefined) === f.key;
            const href = f.key ? `/pedidos?status=${f.key}` : "/pedidos";
            return (
              <Link
                key={f.label}
                href={href}
                className={
                  active
                    ? "inline-flex items-center h-9 px-4 rounded-full text-sm font-semibold bg-crave-pink text-crave-brown shadow-soft whitespace-nowrap"
                    : "inline-flex items-center h-9 px-4 rounded-full text-sm font-medium bg-crave-cream border border-crave-brown/15 text-crave-brown/70 hover:text-crave-brown whitespace-nowrap"
                }
              >
                {f.label}
              </Link>
            );
          })}
        </div>
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

      <Link
        href="/pedidos/nuevo"
        aria-label="Nuevo pedido"
        className="lg:hidden fixed bottom-24 right-4 z-30 inline-flex items-center gap-2 h-14 pl-5 pr-6 rounded-full bg-crave-pink text-crave-brown font-semibold shadow-lg active:scale-95 transition-transform"
      >
        <Plus size={20} /> Nuevo
      </Link>
    </main>
  );
}
