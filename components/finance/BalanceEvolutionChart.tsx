import { formatUYU } from "@/lib/money";
import type { DailyBalancePoint } from "@/lib/queries";

const W = 800;
const H = 280;
const PAD = { top: 20, right: 16, bottom: 28, left: 56 };

function formatShortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short" }).format(
    new Date(y, m - 1, d),
  );
}

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) return [min];
  const range = max - min;
  const step = Math.pow(10, Math.floor(Math.log10(range / count)));
  const err = (count * step) / range;
  let mult = 1;
  if (err <= 0.15) mult = 10;
  else if (err <= 0.35) mult = 5;
  else if (err <= 0.75) mult = 2;
  const niceStep = mult * step;
  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + 1e-9; v += niceStep) ticks.push(v);
  return ticks;
}

export function BalanceEvolutionChart({ data }: { data: DailyBalancePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center text-sm text-crave-brown/60 bg-crave-cream/60 border border-crave-brown/10 rounded-card py-10">
        Cuando registres movimientos vas a poder ver la evolución del saldo acá.
      </div>
    );
  }

  const xs = data.map((_, i) => i);
  const ys = data.map((p) => p.balance_cents / 100);
  const xMin = 0;
  const xMax = Math.max(1, xs.length - 1);
  const yRaw = [...ys, 0];
  const yMin = Math.min(...yRaw);
  const yMax = Math.max(...yRaw);
  const ticks = niceTicks(yMin, yMax, 4);
  const yLo = ticks[0];
  const yHi = ticks[ticks.length - 1];

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const sx = (i: number) => PAD.left + ((i - xMin) / (xMax - xMin || 1)) * innerW;
  const sy = (v: number) => PAD.top + (1 - (v - yLo) / (yHi - yLo || 1)) * innerH;

  const linePath = ys.map((v, i) => `${i === 0 ? "M" : "L"} ${sx(i)} ${sy(v)}`).join(" ");
  const areaPath = `${linePath} L ${sx(xs.length - 1)} ${sy(yLo)} L ${sx(0)} ${sy(yLo)} Z`;

  // Etiquetas X: mostramos hasta ~6 marcadores espaciados
  const labelCount = Math.min(6, data.length);
  const xLabels = Array.from({ length: labelCount }, (_, i) => {
    const idx = Math.round((i * (data.length - 1)) / Math.max(1, labelCount - 1));
    return { idx, label: formatShortDate(data[idx].date) };
  });

  const last = data[data.length - 1];

  return (
    <div className="bg-crave-cream/60 border border-crave-brown/10 rounded-card p-5 md:p-6">
      <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
        <div>
          <p className="uppercase tracking-widest text-xs font-semibold text-crave-brown/70 mb-1">
            Evolución del saldo
          </p>
          <p className="text-xs text-crave-brown/60">
            Saldo acumulado de la cuenta madre, día a día.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-crave-brown/60 mb-0.5">Saldo actual</p>
          <p className="font-serif italic font-semibold text-2xl">
            {formatUYU(last.balance_cents)}
          </p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Evolución del saldo">
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f1a4b6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f1a4b6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid + Y labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={sy(t)}
              y2={sy(t)}
              stroke="#573219"
              strokeOpacity={t === 0 ? 0.25 : 0.08}
              strokeDasharray={t === 0 ? "0" : "2 4"}
            />
            <text
              x={PAD.left - 8}
              y={sy(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="#573219"
              fillOpacity="0.6"
            >
              {formatUYU(t * 100, { compact: true })}
            </text>
          </g>
        ))}

        {/* Area + line */}
        <path d={areaPath} fill="url(#balanceFill)" />
        <path d={linePath} fill="none" stroke="#573219" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Punto final */}
        <circle cx={sx(xs.length - 1)} cy={sy(ys[ys.length - 1])} r="4" fill="#f1a4b6" stroke="#573219" strokeWidth="1.5" />

        {/* X labels */}
        {xLabels.map(({ idx, label }) => (
          <text
            key={idx}
            x={sx(idx)}
            y={H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#573219"
            fillOpacity="0.6"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
