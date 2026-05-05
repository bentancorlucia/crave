import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { getIngredientById, listIngredientLots } from "@/lib/queries";
import { IngredientLotsTable } from "@/components/recipes/IngredientLotsTable";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatUYU } from "@/lib/money";
import { EditIngredientForm } from "./form";

export const dynamic = "force-dynamic";

export default async function IngredientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ingredient = await getIngredientById(id);
  if (!ingredient) notFound();

  const lots = await listIngredientLots(id);
  const isLow =
    ingredient.current_stock < ingredient.low_stock_threshold && ingredient.low_stock_threshold > 0;

  return (
    <div className="max-w-3xl mx-auto py-2 space-y-6 pb-12">
      <Link
        href="/cocina/insumos"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown"
      >
        <ChevronLeft size={16} /> Volver
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif italic text-3xl md:text-4xl font-medium">{ingredient.name}</h1>
          <p className="text-sm text-crave-brown/70 mt-1">
            Unidad: {ingredient.unit}
            {ingredient.note && <> · {ingredient.note}</>}
          </p>
        </div>
        {isLow && <Badge tone="pink">stock bajo</Badge>}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-crave-brown/60 font-semibold">
            Stock actual
          </p>
          <p className="font-serif italic text-3xl font-medium tabular-nums mt-1">
            {ingredient.current_stock.toLocaleString("es-UY", { maximumFractionDigits: 3 })}{" "}
            <span className="text-base text-crave-brown/60">{ingredient.unit}</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-crave-brown/60 font-semibold">
            Costo actual (LIFO)
          </p>
          <p className="font-serif italic text-3xl font-medium tabular-nums mt-1">
            {ingredient.last_unit_cost_cents != null
              ? formatUYU(ingredient.last_unit_cost_cents)
              : "—"}{" "}
            <span className="text-base text-crave-brown/60">/{ingredient.unit}</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-crave-brown/60 font-semibold">
            Umbral mínimo
          </p>
          <p className="font-serif italic text-3xl font-medium tabular-nums mt-1">
            {ingredient.low_stock_threshold.toLocaleString("es-UY", { maximumFractionDigits: 3 })}{" "}
            <span className="text-base text-crave-brown/60">{ingredient.unit}</span>
          </p>
        </Card>
      </div>

      <section>
        <div className="flex items-end justify-between mb-3 px-1">
          <div>
            <h2 className="font-serif italic text-xl font-medium">Lotes (LIFO)</h2>
            <p className="text-xs text-crave-brown/60">
              Cada compra es un lote. Al consumir, se descuenta del más reciente primero.
            </p>
          </div>
          <Link
            href={`/cocina/insumos/compras/nueva?ingredient=${id}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Plus size={14} /> Nueva compra
          </Link>
        </div>
        <IngredientLotsTable lots={lots as any} unit={ingredient.unit as any} />
      </section>

      <section>
        <h2 className="font-serif italic text-xl font-medium mb-3 px-1">Editar</h2>
        <EditIngredientForm
          id={id}
          defaults={{
            name: ingredient.name,
            unit: ingredient.unit as any,
            low_stock_threshold: ingredient.low_stock_threshold,
            note: ingredient.note ?? null,
          }}
        />
      </section>
    </div>
  );
}
