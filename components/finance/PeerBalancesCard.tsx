import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatUYU } from "@/lib/money";

type Row = {
  debtor: { id: string; display_name: string; initial: string };
  creditor: { id: string; display_name: string; initial: string };
  amount_cents: number;
};

export function PeerBalancesCard({ rows }: { rows: Row[] }) {
  return (
    <div className="border border-crave-brown/15 rounded-card p-5 md:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-crave-pink/30 p-2 rounded-full text-crave-brown">
          <Scale size={18} />
        </div>
        <h2 className="font-serif italic text-xl font-medium">Saldos entre socias</h2>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-crave-brown/60 text-center py-6">
          Todo saldado por ahora ✿
        </p>
      ) : (
        <ul className="divide-y divide-crave-brown/10">
          {rows.slice(0, 6).map((r, i) => (
            <li key={i} className="flex items-center gap-3 py-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar size="sm" tone="cream" initial={r.debtor.initial} />
                <span className="text-sm font-medium truncate">{r.debtor.display_name}</span>
              </div>
              <ArrowRight size={14} className="opacity-40 shrink-0" />
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar size="sm" tone="cream" initial={r.creditor.initial} />
                <span className="text-sm font-medium truncate">{r.creditor.display_name}</span>
              </div>
              <span className="font-serif text-sm shrink-0">
                {formatUYU(r.amount_cents, { compact: true })}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 pt-4 border-t border-crave-brown/10 flex justify-end">
        <Link
          href="/transferencias/nueva"
          className="text-xs font-medium text-crave-pink hover:underline"
        >
          Registrar transferencia →
        </Link>
      </div>
    </div>
  );
}
