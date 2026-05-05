import { formatUYU } from "@/lib/money";
import type { IngredientUnit } from "@/lib/queries/cocina";

type Lot = {
  id: string;
  quantity_purchased: number;
  quantity_remaining: number;
  total_cost_cents: number;
  unit_cost_cents: number;
  purchased_on: string;
  note: string | null;
  registered_by_profile: { display_name: string; initial: string } | null;
};

export function IngredientLotsTable({
  lots,
  unit,
}: {
  lots: Lot[];
  unit: IngredientUnit;
}) {
  if (!lots.length) {
    return (
      <div className="text-sm text-crave-brown/60 px-4 py-6 text-center bg-crave-cream rounded-2xl border border-crave-brown/10">
        No hay compras registradas todavía.
      </div>
    );
  }

  return (
    <div className="bg-crave-cream rounded-card border border-crave-brown/15 overflow-hidden">
      <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[11px] uppercase tracking-widest text-crave-brown/60 font-semibold border-b border-crave-brown/10">
        <div className="col-span-3">Fecha</div>
        <div className="col-span-3 text-right">Comprado</div>
        <div className="col-span-2 text-right">Restante</div>
        <div className="col-span-2 text-right">Unit.</div>
        <div className="col-span-2 text-right">Total</div>
      </div>
      {lots.map((lot) => {
        const used = lot.quantity_purchased > 0
          ? Math.round((1 - lot.quantity_remaining / lot.quantity_purchased) * 100)
          : 0;
        return (
          <div
            key={lot.id}
            className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b border-crave-brown/5 last:border-b-0 items-center"
          >
            <div className="col-span-3 text-crave-brown/70 text-xs">
              {new Date(lot.purchased_on).toLocaleDateString("es-UY", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
              })}
              {lot.registered_by_profile && (
                <span className="block text-[10px] text-crave-brown/50">
                  {lot.registered_by_profile.display_name}
                </span>
              )}
            </div>
            <div className="col-span-3 text-right tabular-nums">
              {formatNum(lot.quantity_purchased)} {unit}
            </div>
            <div className="col-span-2 text-right tabular-nums">
              <span
                className={
                  lot.quantity_remaining === 0
                    ? "text-crave-brown/40"
                    : used > 80
                      ? "text-crave-brown/70"
                      : "text-crave-brown"
                }
              >
                {formatNum(lot.quantity_remaining)}
              </span>
            </div>
            <div className="col-span-2 text-right tabular-nums text-xs text-crave-brown/80">
              {formatUYU(lot.unit_cost_cents)}
            </div>
            <div className="col-span-2 text-right tabular-nums font-medium">
              {formatUYU(lot.total_cost_cents)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatNum(n: number) {
  if (Number.isInteger(n)) return n.toLocaleString("es-UY");
  return n.toLocaleString("es-UY", { maximumFractionDigits: 3 });
}
