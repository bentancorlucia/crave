import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, ChefHat } from "lucide-react";
import { listProducts } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatUYU } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const products = await listProducts(false);

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
          <h1 className="font-serif italic text-3xl font-medium">Productos</h1>
          <p className="text-sm text-crave-brown/70 mt-1">Catálogo y recetas.</p>
        </div>
        <Link
          href="/cocina/productos/nuevo"
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          <Plus size={16} /> Nuevo
        </Link>
      </header>

      {products.length === 0 ? (
        <p className="text-sm text-crave-brown/70 text-center py-12">
          Todavía no hay productos. Empezá creando uno.
        </p>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => {
            const margin =
              p.current_cost_cents != null && p.sale_price_cents > 0
                ? Math.round(((p.sale_price_cents - p.current_cost_cents) / p.sale_price_cents) * 100)
                : null;
            return (
              <li key={p.id}>
                <Link
                  href={`/cocina/productos/${p.id}`}
                  className="flex items-center gap-3 bg-crave-cream rounded-card border border-crave-brown/15 p-4 hover:bg-crave-blue/30 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-crave-blue inline-flex items-center justify-center">
                    <ChefHat size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{p.name}</h3>
                      {!p.active && <Badge tone="muted">inactivo</Badge>}
                    </div>
                    <p className="text-xs text-crave-brown/70 tabular-nums">
                      {formatUYU(p.sale_price_cents)}
                      {p.current_cost_cents != null ? (
                        <>
                          {" · costo "}
                          {formatUYU(p.current_cost_cents)}
                          {margin != null && <> ({margin}%)</>}
                        </>
                      ) : (
                        <span className="text-crave-brown/50"> · sin receta o falta costo</span>
                      )}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-crave-brown/40" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
