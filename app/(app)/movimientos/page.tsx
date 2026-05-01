import Link from "next/link";
import { Plus } from "lucide-react";
import { listAllMovements } from "@/lib/queries";
import { RecentMovements } from "@/components/finance/RecentMovements";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; month?: string }>;
}) {
  const params = await searchParams;
  const type =
    params.type === "ingreso" || params.type === "egreso" ? params.type : undefined;
  const movements = await listAllMovements({ type, month: params.month });

  return (
    <main className="pb-12 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif italic text-3xl md:text-4xl font-medium">Movimientos</h1>
          <p className="text-sm text-crave-brown/70">
            Todo lo que entró y salió. {movements.length} movimientos.
          </p>
        </div>
        <Link href="/movimientos/nuevo" className={buttonVariants()}>
          <Plus size={16} /> Registrar
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
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

      <RecentMovements movements={movements as any} />
    </main>
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
