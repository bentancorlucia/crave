import Link from "next/link";
import { Plus } from "lucide-react";
import { ExpenseGroupCard, type ExpenseGroupCardData } from "./ExpenseGroupCard";

export function ExpenseGroupsList({
  groups,
  emptyMessage,
  showCreateCta = false,
}: {
  groups: ExpenseGroupCardData[];
  emptyMessage?: string;
  showCreateCta?: boolean;
}) {
  if (groups.length === 0) {
    return (
      <div className="text-center text-sm text-crave-brown/60 bg-crave-cream/60 border border-crave-brown/10 rounded-card py-10 px-4">
        {emptyMessage ?? "Todavía no hay gastos compartidos."}
        {showCreateCta && (
          <>
            {" "}
            <Link
              href="/deudas/nuevo"
              className="text-crave-pink underline underline-offset-2 inline-flex items-center gap-1"
            >
              <Plus size={13} /> Crear el primero
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <ExpenseGroupCard key={g.id} group={g} />
      ))}
    </div>
  );
}
