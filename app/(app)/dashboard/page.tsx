import {
  getMotherBalance,
  getMonthlyStats,
  listExpenseGroups,
  listRecentMovements,
  listPeerBalances,
} from "@/lib/queries";
import { MotherAccountCard } from "@/components/finance/MotherAccountCard";
import { ExpenseGroupsList } from "@/components/finance/ExpenseGroupsList";
import { PeerBalancesCard } from "@/components/finance/PeerBalancesCard";
import { RecentMovements } from "@/components/finance/RecentMovements";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [balance, stats, groups, movements, peers] = await Promise.all([
    getMotherBalance(),
    getMonthlyStats(),
    listExpenseGroups(4),
    listRecentMovements(5),
    listPeerBalances(),
  ]);

  return (
    <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 items-start">
      <section className="lg:col-span-7 space-y-8">
        <MotherAccountCard
          balanceCents={balance}
          monthlyIncome={stats.ingresosCents}
          monthlyExpense={stats.egresosCents}
        />
        <RecentMovements movements={movements as any} />
      </section>

      <section className="lg:col-span-5 space-y-8 lg:sticky lg:top-8">
        <PeerBalancesCard rows={peers} />
        <div>
          <div className="flex items-end justify-between mb-3 px-1">
            <h2 className="font-serif italic text-xl font-medium">Gastos compartidos</h2>
            <Link
              href="/deudas/nuevo"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <Plus size={14} /> Nuevo
            </Link>
          </div>
          <ExpenseGroupsList
            groups={groups}
            showCreateCta
            emptyMessage="Todavía no hay gastos compartidos."
          />
          {groups.length > 0 && (
            <div className="mt-3 text-right">
              <Link
                href="/deudas"
                className="text-sm font-medium opacity-60 hover:opacity-100 hover:text-crave-pink"
              >
                Ver todos →
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
