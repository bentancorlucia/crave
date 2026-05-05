import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  getOrderById,
  listProducts,
  listProfiles,
  listCustomers,
} from "@/lib/queries";
import { EditOrderForm } from "./form";

export const dynamic = "force-dynamic";

export default async function EditarPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getOrderById(id);
  if (!data) notFound();

  const [products, profiles, customers] = await Promise.all([
    listProducts(false),
    listProfiles(),
    listCustomers(),
  ]);

  const isLocked = data.order.status === "realizado" || data.order.status === "entregado";

  return (
    <div className="max-w-2xl mx-auto py-2 space-y-6 pb-12">
      <Link
        href={`/pedidos/${id}`}
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown"
      >
        <ChevronLeft size={16} /> Volver al pedido
      </Link>

      <div>
        <h1 className="font-serif italic text-3xl md:text-4xl font-medium">Editar pedido</h1>
        <p className="text-sm text-crave-brown/70 mt-1">
          {data.order.customer_name_snapshot}
        </p>
      </div>

      {isLocked && (
        <div className="bg-crave-pink/30 border border-crave-pink rounded-card p-4 text-sm">
          Este pedido ya fue confirmado. Para editar productos o cantidades, primero volvé al
          estado <strong>preparando</strong> desde la vista del pedido — eso devuelve los
          ingredientes a sus lotes.
        </div>
      )}

      <EditOrderForm
        orderId={id}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sale_price_cents: p.sale_price_cents,
          active: p.active,
        }))}
        profiles={profiles}
        customers={customers}
        defaults={{
          customer_name: data.order.customer_name_snapshot,
          customer_contact: data.order.customer_contact_snapshot ?? "",
          delivery_kind: data.order.delivery_kind,
          order_date: data.order.order_date,
          due_date: data.order.due_date ?? null,
          notes: data.order.notes ?? null,
          paid_cents: data.order.paid_cents,
          payment_method: data.order.payment_method ?? null,
          items: data.items.map((it) => ({
            product_id: it.product_id,
            quantity: it.quantity,
            unit_price_cents: it.unit_price_cents,
          })),
          cook_ids: data.cooks.map((c) => c.id),
          deliverer_ids: data.deliverers.map((d) => d.id),
        }}
      />
    </div>
  );
}
