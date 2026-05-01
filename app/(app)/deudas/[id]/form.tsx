"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatUYU } from "@/lib/money";
import { addDebtPayment, type AddPaymentState } from "./actions";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function AddPaymentForm({
  debtId,
  groupId,
  maxCents,
}: {
  debtId: string;
  groupId: string;
  maxCents: number;
}) {
  const [state, formAction, isPending] = useActionState<AddPaymentState, FormData>(
    addDebtPayment,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="debt_id" value={debtId} />
      <input type="hidden" name="group_id" value={groupId} />
      <div>
        <Label htmlFor={`amount-${debtId}`}>Monto pagado</Label>
        <Input
          id={`amount-${debtId}`}
          name="amount"
          inputMode="decimal"
          placeholder={formatUYU(maxCents)}
          required
          aria-invalid={!!fe.amount}
        />
        <p className="text-xs text-crave-brown/60 mt-1 px-2">
          Restante: {formatUYU(maxCents)}
        </p>
        {fe.amount && <p className="text-xs text-crave-brown mt-1 px-2">{fe.amount}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`paid_on-${debtId}`}>Fecha</Label>
          <Input
            id={`paid_on-${debtId}`}
            name="paid_on"
            type="date"
            defaultValue={today()}
            required
          />
        </div>
        <div>
          <Label htmlFor={`note-${debtId}`}>Nota</Label>
          <Input id={`note-${debtId}`} name="note" placeholder="Transferencia, efectivo…" />
        </div>
      </div>
      {state.error && (
        <p className="text-sm bg-crave-pink/40 border border-crave-pink rounded-2xl px-4 py-3">
          {state.error}
        </p>
      )}
      <Button type="submit" size="md" className="w-full" disabled={isPending}>
        {isPending ? "Guardando…" : "Registrar reintegro"}
      </Button>
    </form>
  );
}
