"use client";

import { Trash2 } from "lucide-react";
import { deleteDebtPayment } from "./actions";

export function DeletePaymentButton({
  paymentId,
  groupId,
}: {
  paymentId: string;
  groupId: string;
}) {
  const action = deleteDebtPayment.bind(null, paymentId, groupId);
  return (
    <form action={action}>
      <button
        type="submit"
        aria-label="Borrar reintegro"
        className="h-8 w-8 rounded-full inline-flex items-center justify-center text-crave-brown/50 hover:text-crave-brown hover:bg-crave-brown/5 transition-colors"
        onClick={(e) => {
          if (!confirm("¿Borrar este reintegro? La deuda se reabrirá si ya no queda cubierta.")) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 size={14} />
      </button>
    </form>
  );
}
