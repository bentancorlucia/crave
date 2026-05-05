import { AlertTriangle } from "lucide-react";

type Warning = {
  ingredient_id: string;
  ingredient_name: string;
  kind: "shortage" | "low_stock";
  needed?: number;
  consumed?: number;
  missing?: number;
};

export function LowStockWarning({ warnings }: { warnings: Warning[] }) {
  if (!warnings?.length) return null;
  return (
    <div className="bg-crave-pink/30 border border-crave-pink rounded-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} className="text-crave-brown" />
        <p className="text-sm font-semibold">Atención con el stock</p>
      </div>
      <ul className="space-y-1.5 text-sm">
        {warnings.map((w, i) => (
          <li key={i} className="text-crave-brown/85">
            {w.kind === "shortage" ? (
              <>
                <strong>{w.ingredient_name}</strong>: faltó stock para cubrir el consumo
                {typeof w.missing === "number" && (
                  <> (faltaron {formatNum(w.missing)})</>
                )}
                .
              </>
            ) : (
              <>
                <strong>{w.ingredient_name}</strong> quedó por debajo del umbral mínimo.
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatNum(n: number) {
  return n.toLocaleString("es-UY", { maximumFractionDigits: 3 });
}
