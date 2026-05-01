import { formatUYU } from "@/lib/money";
import type { MonthlyFlowPoint } from "@/lib/queries";

const W = 800;
const H = 280;
const PAD = { top: 20, right: 16, bottom: 40, left: 56 };

function formatMonthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("es-UY", { month: "short" })
    .format(d)
    .replace(".", "");
}

function niceCeil(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  if (n <= 1) return 1 * p;
  if (n <= 2) return 2 * p;
  if (n <= 5) return 5 * p;
  return 10 * p;
}

export function MonthlyFlowChart({ data }: { data: MonthlyFlowPoint[] }) {
  const hasActivity = data.some((m) => m.ingresos_cents + m.egresos_cents > 0);
  if (!hasActivity) {
    return (
      <div className="text-center text-sm text-crave-brown/60 bg-crave-cream/60 border border-crave-brown/10 rounded-card py-10">
        Sin datos suficientes para mostrar el flujo mensual todavía.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((m) => Math.max(m.ingresos_cents, m.egresos_cents))) / 100;
  const yMax = niceCeil(maxVal);
  const ticks = [0, yMax / 4, yMax / 2, (3 * yMax) / 4, yMax];

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const groupW = innerW / data.length;
  const barW = Math.min(22, (groupW - 6) / 2);

  const sy = (v: number) => PAD.top + (1 - v / yMax) * innerH;

  return (
    <div className="bg-crave-cream/60 border border-crave-brown/10 rounded-card p-5 md:p-6">
      <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
        <div>
          <p className="uppercase tracking-widest text-xs font-semibold text-crave-brown/70 mb-1">
            Flujo mensual
          </p>
          <p className="text-xs text-crave-brown/60">Ingresos vs egresos por mes.</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-crave-pink" /> Ingresos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-crave-brown" /> Egresos
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Flujo mensual">
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

        {/* Bars */}
        {data.map((m, i) => {
          const cx = PAD.left + groupW * i + groupW / 2;
          const ingY = sy(m.ingresos_cents / 100);
          const egrY = sy(m.egresos_cents / 100);
          const baseY = sy(0);
          return (
            <g key={m.month}>
              <rect
                x={cx - barW - 1}
                y={ingY}
                width={barW}
                height={Math.max(0, baseY - ingY)}
                rx={3}
                fill="#f1a4b6"
              />
              <rect
                x={cx + 1}
                y={egrY}
                width={barW}
                height={Math.max(0, baseY - egrY)}
                rx={3}
                fill="#573219"
                fillOpacity={0.85}
              />
              <text
                x={cx}
                y={H - 22}
                textAnchor="middle"
                fontSize="10"
                fill="#573219"
                fillOpacity="0.7"
                fontWeight={500}
              >
                {formatMonthLabel(m.month)}
              </text>
              <text
                x={cx}
                y={H - 9}
                textAnchor="middle"
                fontSize="9"
                fill="#573219"
                fillOpacity={m.neto_cents === 0 ? 0.4 : 0.6}
                fontStyle="italic"
              >
                {m.neto_cents === 0
                  ? "—"
                  : `${m.neto_cents > 0 ? "+" : "−"}${formatUYU(Math.abs(m.neto_cents), { compact: true })}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
