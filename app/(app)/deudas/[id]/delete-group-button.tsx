"use client";

import { Trash2 } from "lucide-react";
import { deleteExpenseGroup } from "./actions";

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const action = deleteExpenseGroup.bind(null, groupId);
  return (
    <form action={action} className="pt-4">
      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full text-sm font-medium text-crave-brown/70 hover:text-crave-brown hover:bg-crave-brown/5 transition-colors btn-press"
        onClick={(e) => {
          if (
            !confirm(
              "¿Eliminar este gasto compartido? Se borran todas las deudas y reintegros asociados.",
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 size={15} /> Eliminar gasto compartido
      </button>
    </form>
  );
}
