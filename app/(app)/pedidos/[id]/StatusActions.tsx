"use client";

import { Check, Truck, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/queries/pedidos";
import {
  confirmOrder,
  markDelivered,
  revertConfirmation,
  cancelOrder,
} from "./actions";

export function StatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  if (status === "cancelado") {
    return (
      <p className="text-sm text-crave-brown/60 italic">Este pedido está cancelado.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "preparando" && (
        <form action={confirmOrder.bind(null, orderId)}>
          <Button type="submit" size="md">
            <Check size={16} /> Marcar realizado
          </Button>
        </form>
      )}
      {status === "realizado" && (
        <>
          <form action={markDelivered.bind(null, orderId)}>
            <Button type="submit" size="md">
              <Truck size={16} /> Marcar entregado
            </Button>
          </form>
          <form action={revertConfirmation.bind(null, orderId)}>
            <Button
              type="submit"
              size="md"
              variant="ghost"
              onClick={(e) => {
                if (
                  !confirm(
                    "Volver a 'preparando' devolverá los ingredientes consumidos a sus lotes. ¿Continuar?",
                  )
                )
                  e.preventDefault();
              }}
            >
              <RotateCcw size={16} /> Volver a preparando
            </Button>
          </form>
        </>
      )}
      {(status === "preparando" || status === "realizado") && (
        <form action={cancelOrder.bind(null, orderId)}>
          <Button
            type="submit"
            size="md"
            variant="outline"
            onClick={(e) => {
              if (!confirm("¿Cancelar este pedido? Si fue confirmado, el stock se devolverá."))
                e.preventDefault();
            }}
          >
            <X size={16} /> Cancelar
          </Button>
        </form>
      )}
    </div>
  );
}
