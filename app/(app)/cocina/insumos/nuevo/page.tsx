import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { IngredientForm } from "@/components/recipes/IngredientForm";
import { createIngredient } from "./actions";

export const dynamic = "force-dynamic";

export default function NuevoIngredientePage() {
  return (
    <div className="max-w-xl mx-auto py-2">
      <Link
        href="/cocina/insumos"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown mb-4"
      >
        <ChevronLeft size={16} /> Volver
      </Link>
      <h1 className="font-serif italic text-2xl md:text-4xl font-medium mb-2">
        Nuevo ingrediente
      </h1>
      <p className="text-sm text-crave-brown/70 mb-7">
        Definí nombre, unidad de medida y un umbral para alertas de stock bajo.
      </p>
      <IngredientForm action={createIngredient} submitLabel="Crear ingrediente" />
    </div>
  );
}
