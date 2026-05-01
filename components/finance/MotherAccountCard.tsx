import Link from "next/link";
import { TrendingUp, Plus, Wallet } from "lucide-react";
import { formatUYU } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export function MotherAccountCard({
  balanceCents,
  monthlyIncome,
  monthlyExpense,
}: {
  balanceCents: number;
  monthlyIncome: number;
  monthlyExpense: number;
}) {
  const neto = monthlyIncome - monthlyExpense;
  const netoPositive = neto >= 0;
  return (
    <div className="bg-crave-blue rounded-hero p-7 md:p-10 border border-crave-brown/15 shadow-soft relative overflow-hidden">
      <svg
        className="absolute -top-10 -right-10 w-44 h-44 text-crave-brown opacity-[0.06] pointer-events-none rotate-12"
        viewBox="0 0 100 100"
        fill="currentColor"
        aria-hidden
      >
        <path d="M50 0 L55 40 L95 50 L55 60 L50 100 L45 60 L5 50 L45 40 Z" />
        <circle cx="20" cy="20" r="4" />
        <circle cx="80" cy="80" r="3" />
      </svg>

      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <h2 className="uppercase tracking-widest text-xs font-semibold text-crave-brown/70 inline-flex items-center gap-2">
            <Wallet size={14} /> Cuenta madre
          </h2>
          <Badge tone="pink" className="font-medium">
            <TrendingUp size={12} />
            {netoPositive ? "+ " : ""}
            {formatUYU(Math.abs(neto), { compact: true })} este mes
          </Badge>
        </div>

        <div className="mb-9">
          <p className="text-xs font-medium opacity-70 mb-1">Saldo actual disponible</p>
          <p className="font-serif italic font-semibold text-5xl md:text-7xl tracking-tighter leading-none">
            {formatUYU(balanceCents)}
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6 border-t border-crave-brown/10">
          <div className="flex gap-8">
            <div>
              <p className="text-xs opacity-60 mb-1">Ingresos del mes</p>
              <p className="font-serif font-medium text-lg">{formatUYU(monthlyIncome, { compact: true })}</p>
            </div>
            <div className="w-px bg-crave-brown/10" />
            <div>
              <p className="text-xs opacity-60 mb-1">Egresos del mes</p>
              <p className="font-serif font-medium text-lg">{formatUYU(monthlyExpense, { compact: true })}</p>
            </div>
          </div>
          <Link
            href="/movimientos/nuevo"
            className={buttonVariants({ size: "lg" }) + " w-full md:w-auto"}
          >
            <Plus size={18} /> Registrar movimiento
          </Link>
        </div>
      </div>
    </div>
  );
}
