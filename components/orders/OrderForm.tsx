"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatUYU } from "@/lib/money";
import { cn } from "@/lib/utils";

export type OrderFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type OrderItemDefault = {
  product_id: string;
  quantity: number;
  unit_price_cents: number;
};

export type OrderDefaults = {
  customer_name: string;
  customer_contact: string;
  delivery_kind: "envio" | "retira";
  order_date: string;
  due_date: string | null;
  notes: string | null;
  paid_cents: number;
  payment_method: string | null;
  items: OrderItemDefault[];
  cook_ids: string[];
  deliverer_ids: string[];
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Profile = { id: string; display_name: string; initial: string };
type Product = { id: string; name: string; sale_price_cents: number; active: boolean };

export function OrderForm({
  action,
  products,
  profiles,
  customers,
  defaults,
  submitLabel = "Guardar pedido",
  onDelete,
}: {
  action: (prev: OrderFormState, formData: FormData) => Promise<OrderFormState>;
  products: Product[];
  profiles: Profile[];
  customers: Array<{ id: string; name: string; contact: string | null }>;
  defaults?: OrderDefaults;
  submitLabel?: string;
  onDelete?: (formData: FormData) => Promise<void>;
}) {
  const [state, formAction, isPending] = useActionState<OrderFormState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};

  const [items, setItems] = useState<
    Array<{ product_id: string; quantity: string; unit_price_cents: number }>
  >(
    defaults?.items.map((i) => ({
      product_id: i.product_id,
      quantity: String(i.quantity),
      unit_price_cents: i.unit_price_cents,
    })) ?? [],
  );
  const [cookIds, setCookIds] = useState<string[]>(defaults?.cook_ids ?? []);
  const [delivIds, setDelivIds] = useState<string[]>(defaults?.deliverer_ids ?? []);
  const [customerName, setCustomerName] = useState(defaults?.customer_name ?? "");
  const [customerContact, setCustomerContact] = useState(defaults?.customer_contact ?? "");
  const [deliveryKind, setDeliveryKind] = useState<"envio" | "retira">(
    defaults?.delivery_kind ?? "retira",
  );
  const [paidStr, setPaidStr] = useState(
    defaults && defaults.paid_cents > 0
      ? (defaults.paid_cents / 100).toFixed(2).replace(".", ",")
      : "",
  );

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const total = items.reduce((acc, it) => {
    const q = parseFloat(it.quantity.replace(",", "."));
    if (!Number.isFinite(q)) return acc;
    return acc + Math.round(q * it.unit_price_cents);
  }, 0);

  const addItem = () => {
    const next = products.find((p) => p.active);
    if (!next) return;
    setItems([
      ...items,
      { product_id: next.id, quantity: "1", unit_price_cents: next.sale_price_cents },
    ]);
  };

  const updateItem = (idx: number, patch: Partial<{ product_id: string; quantity: string }>) => {
    setItems(
      items.map((it, i) => {
        if (i !== idx) return it;
        if (patch.product_id) {
          const p = productById.get(patch.product_id);
          return { ...it, ...patch, unit_price_cents: p?.sale_price_cents ?? it.unit_price_cents };
        }
        return { ...it, ...patch };
      }),
    );
  };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const togglePersona = (
    setter: typeof setCookIds,
    list: string[],
    id: string,
  ) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleCustomerSelect = (name: string) => {
    setCustomerName(name);
    const found = customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found && found.contact && !customerContact) {
      setCustomerContact(found.contact);
    }
  };

  return (
    <div className="space-y-4">
      <form
        action={formAction}
        className="space-y-6 bg-crave-blue/40 border border-crave-brown/15 rounded-card p-6"
      >
        {/* Cliente */}
        <fieldset className="space-y-4">
          <legend className="font-serif italic text-lg mb-2">Cliente</legend>
          <div>
            <Label htmlFor="customer_name">Nombre</Label>
            <Input
              id="customer_name"
              name="customer_name"
              list="customers-list"
              placeholder="Ej: María Pérez"
              value={customerName}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              required
              aria-invalid={!!fe.customer_name}
            />
            <datalist id="customers-list">
              {customers.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
            {fe.customer_name && (
              <p className="text-xs text-crave-brown mt-1 px-2">{fe.customer_name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="customer_contact">Contacto (teléfono / Instagram / etc)</Label>
            <Input
              id="customer_contact"
              name="customer_contact"
              placeholder="Ej: 099 123 456 / @maria"
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
            />
          </div>
        </fieldset>

        {/* Entrega */}
        <fieldset className="space-y-4">
          <legend className="font-serif italic text-lg mb-2">Entrega</legend>
          <div>
            <Label>Tipo</Label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-crave-cream rounded-full border border-crave-brown/15">
              <Choice active={deliveryKind === "retira"} onClick={() => setDeliveryKind("retira")}>
                Retira
              </Choice>
              <Choice active={deliveryKind === "envio"} onClick={() => setDeliveryKind("envio")}>
                Envío
              </Choice>
            </div>
            <input type="hidden" name="delivery_kind" value={deliveryKind} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order_date">Fecha de pedido</Label>
              <Input
                id="order_date"
                name="order_date"
                type="date"
                defaultValue={defaults?.order_date ?? today()}
                required
              />
            </div>
            <div>
              <Label htmlFor="due_date">Para cuándo</Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                defaultValue={defaults?.due_date ?? ""}
              />
            </div>
          </div>
        </fieldset>

        {/* Items */}
        <fieldset className="space-y-3">
          <div className="flex items-center justify-between">
            <legend className="font-serif italic text-lg">Productos</legend>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-xs font-medium text-crave-brown/70 hover:text-crave-pink"
            >
              <Plus size={14} /> Agregar producto
            </button>
          </div>

          {items.length === 0 && (
            <p className="text-xs text-crave-brown/60 px-2 py-2">
              Sin productos. Agregá al menos uno.
            </p>
          )}

          <div className="space-y-2">
            {items.map((it, idx) => {
              const p = productById.get(it.product_id);
              const q = parseFloat(it.quantity.replace(",", "."));
              const subtotal = Number.isFinite(q) ? Math.round(q * it.unit_price_cents) : 0;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-crave-cream rounded-2xl p-2 border border-crave-brown/10"
                >
                  <select
                    name="item_product_id"
                    value={it.product_id}
                    onChange={(e) => updateItem(idx, { product_id: e.target.value })}
                    className="flex-1 h-9 rounded-full bg-white border border-crave-brown/15 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-crave-pink"
                  >
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id} disabled={!prod.active}>
                        {prod.name} {!prod.active && "(inactivo)"}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="item_quantity"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                    placeholder="Cant."
                    className="w-16 h-9 rounded-full bg-white border border-crave-brown/15 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-crave-pink"
                    required
                  />
                  <span className="text-xs text-crave-brown/70 w-24 text-right tabular-nums">
                    × {formatUYU(it.unit_price_cents)}
                  </span>
                  <span className="text-sm font-medium w-24 text-right tabular-nums">
                    {formatUYU(subtotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="h-7 w-7 rounded-full hover:bg-crave-brown/10 inline-flex items-center justify-center text-crave-brown/60 hover:text-crave-brown"
                  >
                    <X size={14} />
                  </button>
                  {p && (
                    <input
                      type="hidden"
                      name="item_unit_price_cents"
                      value={it.unit_price_cents}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {items.length > 0 && (
            <div className="text-right text-sm pt-2 border-t border-crave-brown/10">
              <span className="text-crave-brown/60">Total:</span>{" "}
              <span className="font-bold text-base tabular-nums">{formatUYU(total)}</span>
            </div>
          )}
          {fe.items && <p className="text-xs text-crave-brown px-2">{fe.items}</p>}
        </fieldset>

        {/* Equipo */}
        <fieldset className="space-y-4">
          <legend className="font-serif italic text-lg">Equipo</legend>

          <div>
            <Label>Cocinaron</Label>
            <PersonaChips
              profiles={profiles}
              selected={cookIds}
              onToggle={(id) => togglePersona(setCookIds, cookIds, id)}
            />
            {cookIds.map((id) => (
              <input key={id} type="hidden" name="cook_id" value={id} />
            ))}
          </div>

          <div>
            <Label>Entregaron / enviaron</Label>
            <PersonaChips
              profiles={profiles}
              selected={delivIds}
              onToggle={(id) => togglePersona(setDelivIds, delivIds, id)}
            />
            {delivIds.map((id) => (
              <input key={id} type="hidden" name="deliverer_id" value={id} />
            ))}
          </div>
        </fieldset>

        {/* Pago */}
        <fieldset className="space-y-4">
          <legend className="font-serif italic text-lg">Pago</legend>
          <div>
            <Label htmlFor="paid">Monto cobrado ($ UYU)</Label>
            <Input
              id="paid"
              name="paid"
              inputMode="decimal"
              placeholder="0,00"
              value={paidStr}
              onChange={(e) => setPaidStr(e.target.value)}
            />
            <p className="text-xs text-crave-brown/60 mt-1 px-2">
              Cuando llegue al total, se crea un ingreso en la cuenta madre automáticamente.
            </p>
          </div>
          <div>
            <Label htmlFor="payment_method">Método (opcional)</Label>
            <Input
              id="payment_method"
              name="payment_method"
              placeholder="transferencia, efectivo, etc."
              defaultValue={defaults?.payment_method ?? ""}
              maxLength={60}
            />
          </div>
        </fieldset>

        <div>
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Cualquier detalle importante: alergias, sabores, etc."
            defaultValue={defaults?.notes ?? ""}
            maxLength={500}
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
              if (!confirm("¿Borrar este pedido? Si fue confirmado, el stock se devolverá a los lotes.")) {
                e.preventDefault();
              }
            }}
          >
            <Trash2 size={15} /> Borrar pedido
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

function PersonaChips({
  profiles,
  selected,
  onToggle,
}: {
  profiles: Profile[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-1 mt-1">
      {profiles.map((p) => {
        const active = selected.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p.id)}
            className={cn(
              "inline-flex items-center gap-2 h-9 px-3 rounded-full text-sm border transition-all",
              active
                ? "bg-crave-pink text-crave-brown border-crave-pink shadow-soft"
                : "bg-crave-cream text-crave-brown/70 border-crave-brown/20 hover:text-crave-brown",
            )}
          >
            <span
              className={cn(
                "h-5 w-5 rounded-full inline-flex items-center justify-center text-[11px] font-bold",
                active ? "bg-crave-cream" : "bg-crave-brown/10",
              )}
            >
              {p.initial}
            </span>
            {p.display_name}
          </button>
        );
      })}
    </div>
  );
}
