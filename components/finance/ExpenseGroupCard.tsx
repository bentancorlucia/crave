import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatUYU, formatRelativeDate } from "@/lib/money";
import { cn } from "@/lib/utils";

export type ExpenseGroupCardData = {
  id: string;
  description: string;
  total_amount_cents: number;
  occurred_on: string;
  paid_cents: number;
  pending_count: number;
  debts_count: number;
  status: "pendiente" | "saldado";
  payer: { id: string; display_name: string; initial: string } | null;
};

export function ExpenseGroupCard({ group }: { group: ExpenseGroupCardData }) {
  const settled = group.status === "saldado";
  const total = group.total_amount_cents;
  // El total recibible por el pagador puede ser <= total (cuando él participa).
  // Para el progreso visual usamos paid_cents sobre total_amount_cents como indicador relativo.
  const pct = total === 0 ? 0 : Math.min(100, Math.round((group.paid_cents / total) * 100));

  return (
    <Link
      href={`/deudas/${group.id}`}
      className={cn(
        "block bg-crave-cream/60 backdrop-blur-sm border border-crave-brown/10 p-5 rounded-card transition-all hover:border-crave-brown/25 hover:shadow-soft",
        settled && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-serif italic text-lg leading-tight truncate">{group.description}</p>
          <p className="text-xs text-crave-brown/60 mt-1">
            {formatRelativeDate(group.occurred_on)}
            {group.debts_count > 0 && (
              <>
                {" · "}
                {group.debts_count} {group.debts_count === 1 ? "deuda" : "deudas"}
                {group.pending_count > 0 && !settled && (
                  <> · {group.pending_count} pend.</>
                )}
              </>
            )}
          </p>
        </div>
        {settled ? (
          <Badge tone="muted">
            <CheckCircle2 size={12} /> Saldado
          </Badge>
        ) : (
          <Badge tone="outline">Pendiente</Badge>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {group.payer && (
            <>
              <Avatar size="sm" tone="cream" initial={group.payer.initial} />
              <span className="text-sm text-crave-brown/70 truncate">
                Pagó {group.payer.display_name}
              </span>
            </>
          )}
        </div>
        <p
          className={cn(
            "font-serif font-medium text-lg shrink-0",
            settled && "line-through decoration-crave-brown/40",
          )}
        >
          {formatUYU(total)}
        </p>
      </div>

      {!settled && total > 0 && (
        <div className="mt-3 h-1.5 w-full bg-crave-brown/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-crave-pink rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </Link>
  );
}
