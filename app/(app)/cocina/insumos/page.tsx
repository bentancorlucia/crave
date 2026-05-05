import Link from "next/link";
import { ChevronLeft, Plus, Package } from "lucide-react";
import { listIngredients } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatUYU } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function InsumosPage() {
  const ingredients = await listIngredients();

  return (
    <main className="space-y-6 pb-12 max-w-3xl mx-auto">
      <Link
        href="/cocina"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown"
      >
        <ChevronLeft size={16} /> Volver
      </Link>

      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif italic text-3xl font-medium">Insumos</h1>
          <p className="text-sm text-crave-brown/70 mt-1">
            Stock y precio actual (LIFO) de cada ingrediente.
          </p>
        </div>
        <Link
          href="/cocina/insumos/nuevo"
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          <Plus size={16} /> Nuevo
        </Link>
      </header>

      {ingredients.length === 0 ? (
        <p className="text-sm text-crave-brown/70 text-center py-12">
          Todavía no cargaste ingredientes.
        </p>
      ) : (
        <ul className="space-y-2">
          {ingredients.map((i) => {
            const isLow = i.current_stock < i.low_stock_threshold && i.low_stock_threshold > 0;
            return (
              <li key={i.id}>
                <Link
                  href={`/cocina/insumos/${i.id}`}
                  className="flex items-center gap-3 bg-crave-cream rounded-card border border-crave-brown/15 p-4 hover:bg-crave-blue/30 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-crave-blue inline-flex items-center justify-center">
                    <Package size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{i.name}</h3>
                      {isLow && <Badge tone="pink">bajo</Badge>}
                    </div>
                    <p className="text-xs text-crave-brown/70 tabular-nums">
                      {i.current_stock.toLocaleString("es-UY", { maximumFractionDigits: 3 })}{" "}
                      {i.unit}
                      {i.last_unit_cost_cents != null && (
                        <> · {formatUYU(i.last_unit_cost_cents)}/{i.unit}</>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
