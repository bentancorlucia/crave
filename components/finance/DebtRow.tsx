"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatUYU, formatRelativeDate } from "@/lib/money";
import { cn } from "@/lib/utils";
import { AddPaymentForm } from "@/app/(app)/deudas/[id]/form";
import { DeletePaymentButton } from "@/app/(app)/deudas/[id]/delete-payment-button";

type Payment = {
  id: string;
  amount_cents: number;
  paid_on: string;
  note: string | null;
  registered_by_profile: { display_name: string; initial: string } | null;
};

export type DebtRowData = {
  id: string;
  amount_cents: number;
  status: "pendiente" | "saldado";
  totalPaid: number;
  remaining: number;
  debtor: { id: string; display_name: string; initial: string } | null;
  payments: Payment[];
};

export function DebtRow({ debt, groupId }: { debt: DebtRowData; groupId: string }) {
  const [open, setOpen] = useState(debt.status === "pendiente");
  const settled = debt.status === "saldado";

  return (
    <div
      className={cn(
        "border border-crave-brown/10 rounded-card overflow-hidden bg-crave-cream/60",
        settled && "opacity-75",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-crave-brown/5 transition-colors text-left"
      >
        <Avatar size="md" tone="cream" initial={debt.debtor?.initial ?? "?"} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{debt.debtor?.display_name ?? "—"}</p>
          <p className="text-xs text-crave-brown/60">
            {settled ? "Saldó" : `Falta ${formatUYU(debt.remaining)}`}
            {debt.totalPaid > 0 && !settled && (
              <> · pagó {formatUYU(debt.totalPaid)}</>
            )}
          </p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "font-serif font-medium",
              settled && "line-through decoration-crave-brown/40",
            )}
          >
            {formatUYU(debt.amount_cents)}
          </p>
          {settled ? (
            <Badge tone="muted" className="mt-1">
              <CheckCircle2 size={11} /> Saldada
            </Badge>
          ) : (
            <Badge tone="outline" className="mt-1">
              Pendiente
            </Badge>
          )}
        </div>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 transition-transform text-crave-brown/50",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-crave-brown/10 bg-crave-blue/20 p-4 space-y-4">
          {!settled && (
            <AddPaymentForm
              debtId={debt.id}
              groupId={groupId}
              maxCents={debt.remaining}
            />
          )}

          {debt.payments.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-crave-brown/60 mb-2 px-1">
                Reintegros ({debt.payments.length})
              </p>
              <ul className="divide-y divide-crave-brown/10 bg-crave-cream/70 rounded-2xl border border-crave-brown/10">
                {debt.payments.map((p) => (
                  <li key={p.id} className="p-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{formatUYU(p.amount_cents)}</p>
                      <p className="text-xs opacity-60 mt-0.5 inline-flex items-center gap-1.5">
                        <Clock size={11} /> {formatRelativeDate(p.paid_on)}
                        {p.registered_by_profile && (
                          <>
                            <span className="opacity-50">·</span>
                            Reg: {p.registered_by_profile.display_name}
                          </>
                        )}
                      </p>
                      {p.note && <p className="text-xs italic opacity-70 mt-1">{p.note}</p>}
                    </div>
                    <DeletePaymentButton paymentId={p.id} groupId={groupId} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
