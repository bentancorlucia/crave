import { ArrowDownLeft, ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { formatUYU } from "@/lib/money";
import type { EvolutionData } from "@/lib/queries";

function formatLongMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("es-UY", { month: "long", year: "numeric" }).format(d);
}

export function EvolutionStats({ stats }: { stats: EvolutionData["stats"] }) {
  const tiles = [
    {
      label: "Promedio ingresos / mes",
      value: formatUYU(stats.avgMonthlyIncome, { compact: true }),
      icon: <ArrowUpRight size={14} />,
      tone: "pink",
    },
    {
      label: "Promedio egresos / mes",
      value: formatUYU(stats.avgMonthlyExpense, { compact: true }),
      icon: <ArrowDownLeft size={14} />,
      tone: "brown",
    },
    {
      label: "Mejor mes",
      value: stats.bestMonth
        ? `${formatUYU(stats.bestMonth.neto_cents, { compact: true })}`
        : "—",
      sub: stats.bestMonth ? formatLongMonth(stats.bestMonth.month) : null,
      icon: <TrendingUp size={14} />,
      tone: "pink",
    },
    {
      label: "Peor mes",
      value: stats.worstMonth
        ? `${stats.worstMonth.neto_cents >= 0 ? "+" : ""}${formatUYU(stats.worstMonth.neto_cents, { compact: true })}`
        : "—",
      sub: stats.worstMonth ? formatLongMonth(stats.worstMonth.month) : null,
      icon: <TrendingDown size={14} />,
      tone: "brown",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="bg-crave-cream/60 border border-crave-brown/10 rounded-card p-4"
        >
          <div className="flex items-center gap-1.5 text-xs text-crave-brown/60 mb-2">
            <span
              className={
                t.tone === "pink"
                  ? "h-5 w-5 rounded-full bg-crave-pink/30 text-crave-brown flex items-center justify-center"
                  : "h-5 w-5 rounded-full bg-crave-brown/10 text-crave-brown flex items-center justify-center"
              }
            >
              {t.icon}
            </span>
            <span className="truncate">{t.label}</span>
          </div>
          <p className="font-serif italic font-medium text-xl leading-tight">{t.value}</p>
          {t.sub && <p className="text-[11px] text-crave-brown/55 mt-0.5 capitalize">{t.sub}</p>}
        </div>
      ))}
    </div>
  );
}
