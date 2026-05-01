import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import { formatUYU, formatRelativeDate } from "@/lib/money";
import { cn } from "@/lib/utils";

type Movement = {
  id: string;
  type: "ingreso" | "egreso";
  amount_cents: number;
  description: string;
  category: string | null;
  occurred_on: string;
  created_by_profile: { display_name: string; initial: string } | null;
};

export function RecentMovements({ movements }: { movements: Movement[] }) {
  return (
    <section>
      <div className="flex justify-between items-end mb-4 px-1">
        <h2 className="font-serif italic text-2xl font-medium">Últimos movimientos</h2>
        <Link
          href="/movimientos"
          className="text-sm font-medium opacity-60 hover:opacity-100 hover:text-crave-pink transition-colors"
        >
          Ver todos →
        </Link>
      </div>
      {movements.length === 0 ? (
        <div className="text-center text-sm text-crave-brown/60 bg-crave-cream/60 border border-crave-brown/10 rounded-card py-10">
          Todavía no hay movimientos.{" "}
          <Link href="/movimientos/nuevo" className="text-crave-pink underline underline-offset-2">
            Registrá el primero →
          </Link>
        </div>
      ) : (
        <ul className="border border-crave-brown/10 bg-crave-cream/60 rounded-card overflow-hidden divide-y divide-crave-brown/10">
          {movements.map((m) => {
            const isIngreso = m.type === "ingreso";
            return (
              <li key={m.id}>
                <Link
                  href={`/movimientos/${m.id}`}
                  className="flex items-center gap-4 p-4 md:p-5 hover:bg-crave-brown/5 transition-colors"
                >
                  <div
                    className={cn(
                      "h-10 w-10 shrink-0 rounded-full flex items-center justify-center",
                      isIngreso
                        ? "bg-crave-pink/30 text-crave-brown"
                        : "bg-crave-brown/10 text-crave-brown",
                    )}
                  >
                    {isIngreso ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-[15px]">{m.description}</p>
                    <p className="text-xs opacity-60 mt-0.5 truncate inline-flex items-center gap-1.5">
                      <Clock size={11} /> {formatRelativeDate(m.occurred_on)}
                      {m.created_by_profile && (
                        <>
                          <span className="opacity-50">·</span>
                          Reg: {m.created_by_profile.display_name}
                        </>
                      )}
                    </p>
                  </div>
                  <p className="font-serif font-medium shrink-0">{formatUYU(m.amount_cents)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
