import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { IngredientWithStock } from "@/lib/queries/cocina";

export function LowStockCard({ ingredients }: { ingredients: IngredientWithStock[] }) {
  if (!ingredients.length) return null;

  return (
    <Card className="bg-crave-pink/30 border-crave-pink">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle size={14} /> Stock bajo
        </CardTitle>
        <span className="text-xs font-semibold bg-crave-cream rounded-full px-2 py-0.5">
          {ingredients.length}
        </span>
      </CardHeader>
      <ul className="divide-y divide-crave-brown/10">
        {ingredients.slice(0, 6).map((ing) => (
          <li key={ing.id}>
            <Link
              href={`/cocina/insumos/${ing.id}`}
              className="flex items-center justify-between py-2.5 hover:bg-crave-brown/5 rounded-xl px-2 -mx-2 transition-colors"
            >
              <div>
                <p className="font-medium text-sm">{ing.name}</p>
                <p className="text-xs text-crave-brown/60 tabular-nums">
                  {formatNum(ing.current_stock)} {ing.unit} (umbral{" "}
                  {formatNum(ing.low_stock_threshold)})
                </p>
              </div>
              <ChevronRight size={16} className="text-crave-brown/40" />
            </Link>
          </li>
        ))}
      </ul>
      {ingredients.length > 6 && (
        <p className="mt-3 text-xs text-right text-crave-brown/60">
          +{ingredients.length - 6} más
        </p>
      )}
    </Card>
  );
}

function formatNum(n: number) {
  return n.toLocaleString("es-UY", { maximumFractionDigits: 3 });
}
