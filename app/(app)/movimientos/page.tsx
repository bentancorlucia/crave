import Link from "next/link";
import { Plus } from "lucide-react";
import { getMovementsEvolution, listAllMovements } from "@/lib/queries";
import { RecentMovements } from "@/components/finance/RecentMovements";
import { BalanceEvolutionChart } from "@/components/finance/BalanceEvolutionChart";
import { MonthlyFlowChart } from "@/components/finance/MonthlyFlowChart";
import { EvolutionStats } from "@/components/finance/EvolutionStats";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Tab = "lista" | "evolucion";

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; month?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const tab: Tab = params.tab === "evolucion" ? "evolucion" : "lista";
  const type =
    params.type === "ingreso" || params.type === "egreso" ? params.type : undefined;

  return (
    <main className="pb-12 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <h1 className="font-serif italic text-2xl md:text-4xl font-medium">Movimientos</h1>
          <p className="text-sm text-crave-brown/70">
            {tab === "evolucion"
              ? "Cómo evoluciona la cuenta madre con el tiempo."
              : "Todo lo que entró y salió."}
          </p>
        </div>
        <Link
          href="/movimientos/nuevo"
          className={buttonVariants() + " w-full md:w-auto justify-center"}
        >
          <Plus size={16} /> Registrar
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-crave-cream/60 border border-crave-brown/10 rounded-full w-fit">
        <TabPill href="/movimientos" active={tab === "lista"}>
          Lista
        </TabPill>
        <TabPill href="/movimientos?tab=evolucion" active={tab === "evolucion"}>
          Evolución
        </TabPill>
      </div>

      {tab === "evolucion" ? <EvolucionTab /> : <ListaTab type={type} month={params.month} />}
    </main>
  );
}

async function ListaTab({ type, month }: { type?: "ingreso" | "egreso"; month?: string }) {
  const movements = await listAllMovements({ type, month });
  return (
    <>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap min-w-0">
          <FilterPill href="/movimientos" active={!type}>
            Todos
          </FilterPill>
          <FilterPill href="/movimientos?type=ingreso" active={type === "ingreso"}>
            Ingresos
          </FilterPill>
          <FilterPill href="/movimientos?type=egreso" active={type === "egreso"}>
            Egresos
          </FilterPill>
        </div>
        <p className="text-xs text-crave-brown/60 ml-auto">{movements.length} movimientos</p>
      </div>

      <RecentMovements movements={movements as any} />
    </>
  );
}

async function EvolucionTab() {
  const data = await getMovementsEvolution(12);
  return (
    <div className="space-y-6">
      <EvolutionStats stats={data.stats} />
      <BalanceEvolutionChart data={data.dailyBalance} />
      <MonthlyFlowChart data={data.monthlyFlow} />
    </div>
  );
}

function TabPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "px-4 py-1.5 rounded-full bg-crave-brown text-crave-cream text-sm font-semibold"
          : "px-4 py-1.5 rounded-full text-sm font-medium text-crave-brown/70 hover:text-crave-brown"
      }
    >
      {children}
    </Link>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "px-4 py-1.5 rounded-full bg-crave-pink text-crave-brown text-sm font-semibold"
          : "px-4 py-1.5 rounded-full bg-crave-cream border border-crave-brown/20 text-sm font-medium text-crave-brown/70 hover:text-crave-brown"
      }
    >
      {children}
    </Link>
  );
}
