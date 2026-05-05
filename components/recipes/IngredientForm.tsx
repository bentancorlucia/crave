"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { IngredientUnit } from "@/lib/queries/cocina";

export type IngredientFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type IngredientDefaults = {
  name: string;
  unit: IngredientUnit;
  low_stock_threshold: number;
  note: string | null;
};

const UNITS: { value: IngredientUnit; label: string }[] = [
  { value: "g", label: "gramos (g)" },
  { value: "kg", label: "kilos (kg)" },
  { value: "ml", label: "mililitros (ml)" },
  { value: "l", label: "litros (l)" },
  { value: "unidad", label: "unidades" },
];

export function IngredientForm({
  action,
  defaults,
  submitLabel = "Guardar ingrediente",
  onDelete,
}: {
  action: (prev: IngredientFormState, formData: FormData) => Promise<IngredientFormState>;
  defaults?: IngredientDefaults;
  submitLabel?: string;
  onDelete?: (formData: FormData) => Promise<void>;
}) {
  const [state, formAction, isPending] = useActionState<IngredientFormState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};

  return (
    <div className="space-y-4">
      <form
        action={formAction}
        className="space-y-6 bg-crave-blue/40 border border-crave-brown/15 rounded-card p-6"
      >
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            placeholder="Ej: Harina, Manteca, Cacao en polvo"
            defaultValue={defaults?.name ?? ""}
            required
            aria-invalid={!!fe.name}
          />
          {fe.name && <p className="text-xs text-crave-brown mt-1 px-2">{fe.name}</p>}
        </div>

        <div>
          <Label htmlFor="unit">Unidad de medida</Label>
          <select
            id="unit"
            name="unit"
            defaultValue={defaults?.unit ?? "g"}
            className="w-full h-11 rounded-full border border-crave-brown/20 bg-crave-cream px-5 text-[15px] text-crave-brown focus:outline-none focus:ring-2 focus:ring-crave-pink"
            disabled={!!defaults}
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
          {defaults && (
            <p className="text-xs text-crave-brown/60 mt-1 px-2">
              No se puede cambiar la unidad después de creado el ingrediente.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="low_stock_threshold">Umbral de stock bajo</Label>
          <Input
            id="low_stock_threshold"
            name="low_stock_threshold"
            inputMode="decimal"
            placeholder="0"
            defaultValue={defaults?.low_stock_threshold ?? 0}
            required
            aria-invalid={!!fe.low_stock_threshold}
          />
          <p className="text-xs text-crave-brown/60 mt-1 px-2">
            Cuando el stock baje de este valor, aparece la alerta. Dejá 0 para no recibir alertas.
          </p>
          {fe.low_stock_threshold && (
            <p className="text-xs text-crave-brown mt-1 px-2">{fe.low_stock_threshold}</p>
          )}
        </div>

        <div>
          <Label htmlFor="note">Nota (opcional)</Label>
          <Input
            id="note"
            name="note"
            placeholder="Ej: Marca preferida, proveedor"
            defaultValue={defaults?.note ?? ""}
            maxLength={200}
          />
        </div>

        {state.error && (
          <p className="text-sm bg-crave-pink/40 border border-crave-pink rounded-2xl px-4 py-3">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? "Guardando…" : submitLabel}
        </Button>
      </form>

      {onDelete && (
        <form action={onDelete}>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full text-sm font-medium text-crave-brown/70 hover:text-crave-brown hover:bg-crave-brown/5 transition-colors btn-press"
            onClick={(e) => {
              if (!confirm("¿Borrar este ingrediente? No se puede borrar si tiene compras o consumos.")) {
                e.preventDefault();
              }
            }}
          >
            <Trash2 size={15} /> Borrar ingrediente
          </button>
        </form>
      )}
    </div>
  );
}
