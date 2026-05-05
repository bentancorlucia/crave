import { formatUYU } from "@/lib/money";

export function OrderCostSummary({
  totalCents,
  totalCostCents,
}: {
  totalCents: number;
  totalCostCents: number;
}) {
  if (totalCostCents <= 0) return null;
  const profit = totalCents - totalCostCents;
  const margin = totalCents > 0 ? Math.round((profit / totalCents) * 100) : 0;

  return (
    <div className="bg-crave-blue/40 border border-crave-brown/15 rounded-card p-5 space-y-2">
      <h3 className="uppercase tracking-widest text-xs font-semibold text-crave-brown/70">
        Costo y margen
      </h3>
      <div className="flex justify-between text-sm">
        <span className="text-crave-brown/70">Venta</span>
        <span className="tabular-nums">{formatUYU(totalCents)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-crave-brown/70">Costo de ingredientes (LIFO)</span>
        <span className="tabular-nums">{formatUYU(totalCostCents)}</span>
      </div>
      <div className="flex justify-between pt-2 border-t border-crave-brown/10">
        <span className="font-semibold">Ganancia bruta</span>
        <span className="tabular-nums font-semibold">
          {formatUYU(profit)} <span className="text-crave-brown/60 text-xs">({margin}%)</span>
        </span>
      </div>
    </div>
  );
}
