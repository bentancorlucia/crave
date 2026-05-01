"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUYU } from "@/lib/money";

export type MovementFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export type MovementDefaults = {
  type: "ingreso" | "egreso";
  amount_cents: number;
  description: string;
  category: string | null;
  occurred_on: string;
};

export function MovementForm({
  action,
  defaults,
  submitLabel = "Guardar movimiento",
  onDelete,
}: {
  action: (prev: MovementFormState, formData: FormData) => Promise<MovementFormState>;
  defaults?: MovementDefaults;
  submitLabel?: string;
  onDelete?: (formData: FormData) => Promise<void>;
}) {
  const [state, formAction, isPending] = useActionState<MovementFormState, FormData>(action, {});
  const [type, setType] = useState<"ingreso" | "egreso">(defaults?.type ?? "egreso");

  const fe = state.fieldErrors ?? {};
  const defaultAmount = defaults
    ? formatUYU(defaults.amount_cents).replace(/^[^\d]+/, "").trim()
    : "";

  return (
    <div className="space-y-4">
      <form
        action={formAction}
        className="space-y-6 bg-crave-blue/40 border border-crave-brown/15 rounded-card p-6"
      >
        <div>
          <Label>Tipo</Label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-crave-cream rounded-full border border-crave-brown/15">
            <Choice active={type === "ingreso"} onClick={() => setType("ingreso")}>
              ↑ Ingreso
            </Choice>
            <Choice active={type === "egreso"} onClick={() => setType("egreso")}>
              ↓ Egreso
            </Choice>
          </div>
          <input type="hidden" name="type" value={type} />
        </div>

        <div>
          <Label htmlFor="amount">Monto ($ UYU)</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="1.250,00"
            defaultValue={defaultAmount}
            required
            aria-invalid={!!fe.amount}
          />
          {fe.amount && <p className="text-xs text-crave-brown mt-1 px-2">{fe.amount}</p>}
        </div>

        <div>
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            name="description"
            placeholder="Ej: Compra harina y manteca"
            defaultValue={defaults?.description ?? ""}
            required
            aria-invalid={!!fe.description}
          />
          {fe.description && (
            <p className="text-xs text-crave-brown mt-1 px-2">{fe.description}</p>
          )}
        </div>

        <div>
          <Label htmlFor="occurred_on">Fecha</Label>
          <Input
            id="occurred_on"
            name="occurred_on"
            type="date"
            defaultValue={defaults?.occurred_on ?? today()}
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Categoría (opcional)</Label>
          <Input
            id="category"
            name="category"
            placeholder="insumos, packaging, venta…"
            maxLength={60}
            defaultValue={defaults?.category ?? ""}
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
              if (!confirm("¿Borrar este movimiento?")) {
                e.preventDefault();
              }
            }}
          >
            <Trash2 size={15} /> Borrar movimiento
          </button>
        </form>
      )}
    </div>
  );
}

function Choice({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full text-sm font-medium transition-all",
        active
          ? "bg-crave-pink text-crave-brown shadow-soft"
          : "text-crave-brown/70 hover:text-crave-brown",
      )}
    >
      {children}
    </button>
  );
}
