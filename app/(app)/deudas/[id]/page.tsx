import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { getExpenseGroupWithDebts } from "@/lib/queries";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatUYU, formatRelativeDate } from "@/lib/money";
import { DebtRow } from "@/components/finance/DebtRow";
import { DeleteGroupButton } from "./delete-group-button";

export const dynamic = "force-dynamic";

export default async function ExpenseGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getExpenseGroupWithDebts(id);
  if (!data) notFound();
  const { group, debts, totalPaid, totalDebts, remaining } = data;
  const settled = remaining === 0 && debts.length > 0;
  const payer = (group as any).payer as { display_name: string; initial: string } | null;
  const total = group.total_amount_cents;
  const pct = total === 0 ? 0 : Math.min(100, Math.round((totalPaid / total) * 100));

  return (
    <main className="max-w-2xl mx-auto py-2 pb-16 space-y-6">
      <Link
        href="/deudas"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown"
      >
        <ChevronLeft size={16} /> Volver a deudas
      </Link>

      <header className="bg-crave-blue rounded-hero p-5 md:p-7 border border-crave-brown/15 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-widest font-semibold text-crave-brown/70">
            Gasto compartido
          </p>
          {settled ? (
            <Badge tone="muted">
              <CheckCircle2 size={12} /> Saldado
            </Badge>
          ) : (
            <Badge tone="pink">Pendiente</Badge>
          )}
        </div>

        <h1 className="font-serif italic text-xl md:text-3xl font-medium leading-tight mb-3 break-words">
          {group.description}
        </h1>

        <div className="flex items-center gap-2 mb-5">
          {payer && <Avatar size="sm" tone="cream" initial={payer.initial} />}
          <span className="text-sm text-crave-brown/80">
            Pagó {payer?.display_name ?? "—"} · {formatRelativeDate(group.occurred_on)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-5 border-t border-crave-brown/10">
          <Stat label="Total" value={formatUYU(total)} />
          <Stat label="Reintegrado" value={formatUYU(totalPaid)} />
          <Stat
            label={settled ? "Restante" : "Falta"}
            value={formatUYU(remaining)}
            highlight={!settled && remaining > 0}
          />
        </div>

        {!settled && totalDebts > 0 && (
          <div className="mt-5 h-2 w-full bg-crave-brown/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-crave-pink rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {(group as any).note && (
          <p className="text-xs text-crave-brown/70 mt-4 italic">{(group as any).note}</p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="font-serif italic text-xl font-medium px-1">
          Quién debe ({debts.length})
        </h2>
        {debts.length === 0 ? (
          <p className="text-sm text-crave-brown/60 bg-crave-cream/60 border border-crave-brown/10 rounded-card py-6 text-center">
            Este gasto no tiene deudas asociadas.
          </p>
        ) : (
          debts.map((d) => (
            <DebtRow key={d.id} debt={d as any} groupId={id} />
          ))
        )}
      </section>

      <DeleteGroupButton groupId={id} />
    </main>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider opacity-60">{label}</p>
      <p className={highlight ? "font-serif font-semibold text-crave-brown" : "font-serif"}>
        {value}
      </p>
    </div>
  );
}
