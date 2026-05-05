"use client";

import { Trash2 } from "lucide-react";
import { deleteOrder } from "./actions";

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  return (
    <form action={deleteOrder.bind(null, orderId)} className="pt-2">
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full text-xs font-medium text-crave-brown/60 hover:text-crave-brown hover:bg-crave-brown/5 transition-colors"
        onClick={(e) => {
          if (
            !confirm(
              "¿Borrar este pedido para siempre? Si tiene stock asociado, se devolverá.",
            )
          )
            e.preventDefault();
        }}
      >
        <Trash2 size={13} /> Borrar pedido
      </button>
    </form>
  );
}
