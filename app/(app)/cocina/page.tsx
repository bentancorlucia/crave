import Link from "next/link";
import { ChefHat, Package, Plus, ChevronRight, ShoppingCart } from "lucide-react";
import { listProducts, listIngredients, getLowStockIngredients } from "@/lib/queries";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatUYU } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function CocinaPage() {
  const [products, ingredients, lowStock] = await Promise.all([
    listProducts(false),
    listIngredients(),
    getLowStockIngredients(),
  ]);

  return (
    <main className="space-y-8 pb-12">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif italic text-3xl md:text-4xl font-medium">Cocina</h1>
          <p className="text-sm text-crave-brown/70 mt-1">
            Productos, recetas e insumos.
          </p>
        </div>
        <Link
          href="/cocina/insumos/compras/nueva"
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          <ShoppingCart size={16} /> Registrar compra
        </Link>
      </header>

      {lowStock.length > 0 && (
        <div className="bg-crave-pink/30 border border-crave-pink rounded-card p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-sm">
              {lowStock.length} {lowStock.length === 1 ? "ingrediente" : "ingredientes"} con stock bajo
            </p>
            <p className="text-xs text-crave-brown/70">
              {lowStock.slice(0, 3).map((i) => i.name).join(", ")}
              {lowStock.length > 3 && "…"}
            </p>
          </div>
          <Link
            href="/cocina/insumos"
            className="text-sm font-semibold underline underline-offset-2"
          >
            Ver
          </Link>
        </div>
      )}

      {/* Productos */}
      <section>
        <div className="flex items-end justify-between mb-3 px-1">
          <div>
            <h2 className="font-serif italic text-xl font-medium">Productos</h2>
            <p className="text-xs text-crave-brown/60">
              Lo que se vende. Cada uno tiene su receta.
            </p>
          </div>
          <Link
            href="/cocina/productos/nuevo"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Plus size={14} /> Nuevo
          </Link>
        </div>

        {products.length === 0 ? (
          <Card>
            <p className="text-sm text-crave-brown/70 text-center py-4">
              Todavía no cargaste productos. Empezá creando uno.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {products.map((p) => {
              const margin =
                p.current_cost_cents != null && p.sale_price_cents > 0
                  ? Math.round(((p.sale_price_cents - p.current_cost_cents) / p.sale_price_cents) * 100)
                  : null;
              return (
                <Link
                  key={p.id}
                  href={`/cocina/productos/${p.id}`}
                  className="bg-crave-cream rounded-card border border-crave-brown/15 p-4 hover:bg-crave-blue/30 transition-colors flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-full bg-crave-blue inline-flex items-center justify-center">
                    <ChefHat size={18} className="text-crave-brown" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{p.name}</h3>
                      {!p.active && <Badge tone="muted">inactivo</Badge>}
                    </div>
                    <p className="text-xs text-crave-brown/70">
                      {formatUYU(p.sale_price_cents)}
                      {p.current_cost_cents != null ? (
                        <>
                          {" · costo "}
                          {formatUYU(p.current_cost_cents)}
                          {margin != null && (
                            <span className={margin >= 50 ? "text-emerald-700" : margin >= 20 ? "" : "text-crave-pink"}>
                              {" "}
                              ({margin}%)
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-crave-brown/50"> · sin receta o falta costo</span>
                      )}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-crave-brown/40" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Ingredientes */}
      <section>
        <div className="flex items-end justify-between mb-3 px-1">
          <div>
            <h2 className="font-serif italic text-xl font-medium">Insumos</h2>
            <p className="text-xs text-crave-brown/60">
              Los ingredientes con los que cocinamos.
            </p>
          </div>
          <Link
            href="/cocina/insumos/nuevo"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Plus size={14} /> Nuevo
          </Link>
        </div>

        {ingredients.length === 0 ? (
          <Card>
            <p className="text-sm text-crave-brown/70 text-center py-4">
              Todavía no cargaste ingredientes.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ingredients.map((i) => {
              const isLow = i.current_stock < i.low_stock_threshold && i.low_stock_threshold > 0;
              return (
                <Link
                  key={i.id}
                  href={`/cocina/insumos/${i.id}`}
                  className="bg-crave-cream rounded-card border border-crave-brown/15 p-4 hover:bg-crave-blue/30 transition-colors flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-full bg-crave-blue inline-flex items-center justify-center">
                    <Package size={18} className="text-crave-brown" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{i.name}</h3>
                      {isLow && <Badge tone="pink">bajo</Badge>}
                    </div>
                    <p className="text-xs text-crave-brown/70 tabular-nums">
                      Stock: {i.current_stock.toLocaleString("es-UY", { maximumFractionDigits: 3 })}{" "}
                      {i.unit}
                      {i.last_unit_cost_cents != null && (
                        <> · {formatUYU(i.last_unit_cost_cents)}/{i.unit}</>
                      )}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-crave-brown/40" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
