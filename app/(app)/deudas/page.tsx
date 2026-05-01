import Link from "next/link";
import { Plus, Send } from "lucide-react";
import { listExpenseGroups } from "@/lib/queries";
import { ExpenseGroupsList } from "@/components/finance/ExpenseGroupsList";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DeudasPage() {
  const groups = await listExpenseGroups(50);
  const pendientes = groups.filter((g) => g.status === "pendiente");
  const saldados = groups.filter((g) => g.status === "saldado");

  return (
    <main className="pb-12 space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif italic text-3xl md:text-4xl font-medium">Deudas</h1>
          <p className="text-sm text-crave-brown/70 mt-1">
            Gastos compartidos del grupo. Una socia pone la plata, se reparte entre varias y se
            saldan registrando reintegros.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/transferencias/nueva" className={buttonVariants({ variant: "secondary" })}>
            <Send size={15} /> Pagar a una socia
          </Link>
          <Link href="/deudas/nuevo" className={buttonVariants()}>
            <Plus size={15} /> Nuevo gasto compartido
          </Link>
        </div>
      </div>

      <section>
        <h2 className="font-serif italic text-xl font-medium mb-3 px-1">
          Pendientes ({pendientes.length})
        </h2>
        <ExpenseGroupsList
          groups={pendientes}
          showCreateCta
          emptyMessage="No hay gastos compartidos pendientes."
        />
      </section>

      {saldados.length > 0 && (
        <section>
          <h2 className="font-serif italic text-xl font-medium mb-3 px-1 opacity-70">Saldados</h2>
          <ExpenseGroupsList groups={saldados} />
        </section>
      )}
    </main>
  );
}
