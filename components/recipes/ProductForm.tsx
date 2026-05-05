"use client";

import { useActionState, useState } from "react";
import { Trash2, Plus, X } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUYU } from "@/lib/money";
import type { IngredientUnit } from "@/lib/queries/cocina";

export type ProductFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ProductDefaults = {
  name: string;
  description: string | null;
  sale_price_cents: number;
  active: boolean;
  recipe: Array<{ ingredient_id: string; quantity: number }>;
};

type Ingredient = {
  id: string;
  name: string;
  unit: IngredientUnit;
  last_unit_cost_cents: number | null;
};

export function ProductForm({
  action,
  ingredients,
  defaults,
  submitLabel = "Guardar producto",
  onDelete,
}: {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  ingredients: Ingredient[];
  defaults?: ProductDefaults;
  submitLabel?: string;
  onDelete?: (formData: FormData) => Promise<void>;
}) {
  const [state, formAction, isPending] = useActionState<ProductFormState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};
  const [recipe, setRecipe] = useState<Array<{ ingredient_id: string; quantity: string }>>(
    defaults?.recipe.map((r) => ({ ingredient_id: r.ingredient_id, quantity: String(r.quantity) })) ??
      [],
  );
  const [priceStr, setPriceStr] = useState(
    defaults ? String((defaults.sale_price_cents / 100).toFixed(2).replace(".", ",")) : "",
  );

  const ingById = new Map(ingredients.map((i) => [i.id, i]));

  const totalCostCents = recipe.reduce((acc, line) => {
    const ing = ingById.get(line.ingredient_id);
    const q = parseFloat(line.quantity.replace(",", "."));
    if (!ing || !ing.last_unit_cost_cents || !Number.isFinite(q)) return acc;
    return acc + Math.round(q * ing.last_unit_cost_cents);
  }, 0);
  const allHaveCost = recipe.length > 0 && recipe.every((l) => {
    const ing = ingById.get(l.ingredient_id);
    return ing?.last_unit_cost_cents != null;
  });

  const priceCents = priceStr
    ? Math.round(parseFloat(priceStr.replace(/\./g, "").replace(",", ".")) * 100)
    : 0;
  const margin =
    allHaveCost && priceCents > 0
      ? Math.round(((priceCents - totalCostCents) / priceCents) * 100)
      : null;

  const addLine = () => {
    const used = new Set(recipe.map((r) => r.ingredient_id));
    const next = ingredients.find((i) => !used.has(i.id));
    if (next) setRecipe([...recipe, { ingredient_id: next.id, quantity: "" }]);
  };

  const removeLine = (idx: number) => setRecipe(recipe.filter((_, i) => i !== idx));

  const updateLine = (idx: number, patch: Partial<{ ingredient_id: string; quantity: string }>) => {
    setRecipe(recipe.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  return (
    <div className="space-y-4">
      <form
        action={formAction}
        className="space-y-6 bg-crave-blue/40 border border-crave-brown/15 rounded-card p-6"
      >
        <div>
          <Label htmlFor="name">Nombre del producto</Label>
          <Input
            id="name"
            name="name"
            placeholder="Ej: Brownie clásico"
            defaultValue={defaults?.name ?? ""}
            required
            aria-invalid={!!fe.name}
          />
          {fe.name && <p className="text-xs text-crave-brown mt-1 px-2">{fe.name}</p>}
        </div>

        <div>
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Una breve descripción del producto"
            defaultValue={defaults?.description ?? ""}
            maxLength={500}
          />
        </div>

        <div>
          <Label htmlFor="sale_price">Precio de venta ($ UYU)</Label>
          <Input
            id="sale_price"
            name="sale_price"
            inputMode="decimal"
            placeholder="0,00"
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            required
            aria-invalid={!!fe.sale_price}
          />
          {fe.sale_price && <p className="text-xs text-crave-brown mt-1 px-2">{fe.sale_price}</p>}
        </div>

        <label className="flex items-center gap-3 px-2 cursor-pointer">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaults?.active ?? true}
            className="h-4 w-4 accent-crave-pink"
          />
          <span className="text-sm text-crave-brown">Producto activo (disponible para venta)</span>
        </label>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="mb-0">Receta</Label>
            <button
              type="button"
              onClick={addLine}
              disabled={recipe.length >= ingredients.length}
              className="inline-flex items-center gap-1 text-xs font-medium text-crave-brown/70 hover:text-crave-pink disabled:opacity-50"
            >
              <Plus size={14} /> Agregar ingrediente
            </button>
          </div>

          {recipe.length === 0 && (
            <p className="text-xs text-crave-brown/60 px-2 py-2">
              Sin ingredientes. Agregá al menos uno para poder calcular el costo.
            </p>
          )}

          <div className="space-y-2">
            {recipe.map((line, idx) => {
              const ing = ingById.get(line.ingredient_id);
              const q = parseFloat(line.quantity.replace(",", "."));
              const lineCost =
                ing && ing.last_unit_cost_cents && Number.isFinite(q)
                  ? Math.round(q * ing.last_unit_cost_cents)
                  : null;
              const used = new Set(recipe.map((r, i) => (i === idx ? "" : r.ingredient_id)));
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-crave-cream rounded-2xl p-2 border border-crave-brown/10"
                >
                  <select
                    name="recipe_ingredient_id"
                    value={line.ingredient_id}
                    onChange={(e) => updateLine(idx, { ingredient_id: e.target.value })}
                    className="flex-1 h-9 rounded-full bg-white border border-crave-brown/15 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-crave-pink"
                  >
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id} disabled={used.has(i.id)}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="recipe_quantity"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                    placeholder="Cant."
                    className="w-24 h-9 rounded-full bg-white border border-crave-brown/15 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-crave-pink"
                    required
                  />
                  <span className="text-xs text-crave-brown/60 w-10">{ing?.unit ?? ""}</span>
                  <span className="text-xs text-crave-brown/70 w-20 text-right tabular-nums">
                    {lineCost != null ? formatUYU(lineCost) : "—"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="h-7 w-7 rounded-full hover:bg-crave-brown/10 inline-flex items-center justify-center text-crave-brown/60 hover:text-crave-brown"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {recipe.length > 0 && (
            <div className="mt-3 pt-3 border-t border-crave-brown/10 flex items-center justify-between text-sm px-2">
              <div>
                <span className="text-crave-brown/60">Costo de receta:</span>{" "}
                <span className="font-semibold tabular-nums">
                  {allHaveCost ? formatUYU(totalCostCents) : "Falta cargar costo de algún ingrediente"}
                </span>
              </div>
              {margin != null && (
                <Badge tone={margin >= 50 ? "blue" : margin >= 20 ? "cream" : "pink"}>
                  Margen {margin}%
                </Badge>
              )}
            </div>
          )}
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
              if (!confirm("¿Borrar este producto? Si tiene pedidos asociados, no se podrá borrar.")) {
                e.preventDefault();
              }
            }}
          >
            <Trash2 size={15} /> Borrar producto
          </button>
        </form>
      )}
    </div>
  );
}
