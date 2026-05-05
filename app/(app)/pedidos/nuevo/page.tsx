import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listProducts, listProfiles, listCustomers } from "@/lib/queries";
import { OrderForm } from "@/components/orders/OrderForm";
import { createOrder } from "./actions";

export const dynamic = "force-dynamic";

export default async function NuevoPedidoPage() {
  const [products, profiles, customers] = await Promise.all([
    listProducts(true),
    listProfiles(),
    listCustomers(),
  ]);

  if (products.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-2">
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown mb-4"
        >
          <ChevronLeft size={16} /> Volver
        </Link>
        <h1 className="font-serif italic text-2xl md:text-4xl font-medium mb-4">Nuevo pedido</h1>
        <div className="bg-crave-pink/30 border border-crave-pink rounded-card p-5 text-sm">
          Necesitás tener al menos un producto activo en el catálogo antes de crear pedidos.{" "}
          <Link
            href="/cocina/productos/nuevo"
            className="font-semibold underline underline-offset-2"
          >
            Crear producto
          </Link>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-2">
      <Link
        href="/pedidos"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown mb-4"
      >
        <ChevronLeft size={16} /> Volver
      </Link>
      <h1 className="font-serif italic text-2xl md:text-4xl font-medium mb-2">Nuevo pedido</h1>
      <p className="text-sm text-crave-brown/70 mb-7">
        Cargá quién pidió, qué pidió y quiénes están a cargo. El descuento de stock y el ingreso a la cuenta madre se manejan después al confirmar y cobrar.
      </p>
      <OrderForm
        action={createOrder}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sale_price_cents: p.sale_price_cents,
          active: p.active,
        }))}
        profiles={profiles}
        customers={customers}
        submitLabel="Crear pedido"
      />
    </div>
  );
}
