"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatUYU } from "@/lib/money";
import type { IngredientUnit } from "@/lib/queries/cocina";

export type PurchaseFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function IngredientPurchaseForm({
  action,
  ingredients,
  preselectedIngredientId,
}: {
  action: (prev: PurchaseFormState, formData: FormData) => Promise<PurchaseFormState>;
  ingredients: Array<{ id: string; name: string; unit: IngredientUnit }>;
  preselectedIngredientId?: string;
}) {
  const [state, formAction, isPending] = useActionState<PurchaseFormState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};
  const [ingredientId, setIngredientId] = useState(
    preselectedIngredientId ?? ingredients[0]?.id ?? "",
  );
  const [quantityStr, setQuantityStr] = useState("");
  const [costStr, setCostStr] = useState("");

  const selected = ingredients.find((i) => i.id === ingredientId);

  const quantity = parseFloat(quantityStr.replace(",", "."));
  const cost = parseFloat(costStr.replace(/\./g, "").replace(",", "."));
  const unitCostCents =
    Number.isFinite(quantity) && quantity > 0 && Number.isFinite(cost) && cost > 0
      ? Math.round((cost / quantity) * 100)
      : null;

  return (
    <form
      action={formAction}
      className="space-y-6 bg-crave-blue/40 border border-crave-brown/15 rounded-card p-6"
    >
      <div>
        <Label htmlFor="ingredient_id">Ingrediente</Label>
        <select
          id="ingredient_id"
          name="ingredient_id"
          value={ingredientId}
          onChange={(e) => setIngredientId(e.target.value)}
          required
          className="w-full h-11 rounded-full border border-crave-brown/20 bg-crave-cream px-5 text-[15px] text-crave-brown focus:outline-none focus:ring-2 focus:ring-crave-pink"
        >
          <option value="" disabled>
            Elegir ingrediente…
          </option>
          {ingredients.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} ({i.unit})
            </option>
          ))}
        </select>
        {fe.ingredient_id && (
          <p className="text-xs text-crave-brown mt-1 px-2">{fe.ingredient_id}</p>
        )}
      </div>

      <div>
        <Label htmlFor="quantity">
          Cantidad {selected && <span className="text-crave-brown/60">({selected.unit})</span>}
        </Label>
        <Input
          id="quantity"
          name="quantity"
          inputMode="decimal"
          placeholder="Ej: 5000 (en gramos) o 5 (en kilos)"
          value={quantityStr}
          onChange={(e) => setQuantityStr(e.target.value)}
          required
          aria-invalid={!!fe.quantity}
        />
        {fe.quantity && <p className="text-xs text-crave-brown mt-1 px-2">{fe.quantity}</p>}
      </div>

      <div>
        <Label htmlFor="total_cost">Costo total ($ UYU)</Label>
        <Input
          id="total_cost"
          name="total_cost"
          inputMode="decimal"
          placeholder="0,00"
          value={costStr}
          onChange={(e) => setCostStr(e.target.value)}
          required
          aria-invalid={!!fe.total_cost}
        />
        {fe.total_cost && <p className="text-xs text-crave-brown mt-1 px-2">{fe.total_cost}</p>}
        {unitCostCents != null && selected && (
          <p className="text-xs text-crave-brown/70 mt-1 px-2">
            Costo unitario: {formatUYU(unitCostCents)} por {selected.unit}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="purchased_on">Fecha de compra</Label>
        <Input
          id="purchased_on"
          name="purchased_on"
          type="date"
          defaultValue={today()}
          required
        />
      </div>

      <div>
        <Label htmlFor="note">Nota (opcional)</Label>
        <Input
          id="note"
          name="note"
          placeholder="Ej: Tienda Inglesa, oferta"
          maxLength={200}
        />
      </div>

      <label className="flex items-start gap-3 px-2 cursor-pointer">
        <input
          type="checkbox"
          name="create_movement"
          defaultChecked
          className="mt-1 h-4 w-4 accent-crave-pink"
        />
        <div className="text-sm text-crave-brown">
          <strong className="font-semibold">Registrar como egreso</strong> en la cuenta madre
          <p className="text-xs text-crave-brown/60 mt-0.5">
            Desmarcá si la compra se hizo con plata personal de una socia.
          </p>
        </div>
      </label>

      {state.error && (
        <p className="text-sm bg-crave-pink/40 border border-crave-pink rounded-2xl px-4 py-3">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Guardando…" : "Registrar compra"}
      </Button>
    </form>
  );
}
