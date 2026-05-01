"use client";

import { useActionState, useMemo, useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUYU, parseToCents } from "@/lib/money";
import { createExpenseGroup, type CreateExpenseGroupState } from "./actions";

type Profile = { id: string; display_name: string; initial: string };

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function NewExpenseGroupForm({
  profiles,
  currentProfileId,
}: {
  profiles: Profile[];
  currentProfileId: string | null;
}) {
  const [state, formAction, isPending] = useActionState<CreateExpenseGroupState, FormData>(
    createExpenseGroup,
    {},
  );

  const [payerId, setPayerId] = useState<string>(currentProfileId ?? profiles[0]?.id ?? "");
  const [participants, setParticipants] = useState<Set<string>>(
    () => new Set(profiles.map((p) => p.id)),
  );
  const [includePayer, setIncludePayer] = useState(true);
  const [amountStr, setAmountStr] = useState("");

  const fe = state.fieldErrors ?? {};

  const profilesById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const toggleParticipant = (id: string) => {
    setParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const preview = useMemo(() => {
    const totalCents = parseToCents(amountStr);
    if (!totalCents || totalCents <= 0 || !payerId) return null;
    const others = Array.from(participants).filter((id) => id !== payerId);
    if (others.length === 0) return null;
    const nSplit = includePayer ? others.length + 1 : others.length;
    const share = Math.floor(totalCents / nSplit);
    const extra = totalCents - share * nSplit;
    others.sort();
    return others.map((id, i) => ({
      debtor: profilesById.get(id)!,
      amount: share + (!includePayer && i === 0 ? extra : 0),
    }));
  }, [amountStr, payerId, participants, includePayer, profilesById]);

  const payerProfile = profilesById.get(payerId);
  const hasOtherParticipant = Array.from(participants).some((id) => id !== payerId);

  return (
    <form
      action={formAction}
      className="space-y-6 bg-crave-blue/40 border border-crave-brown/15 rounded-card p-6"
    >
      <div>
        <Label htmlFor="payer_profile_id">¿Quién pagó?</Label>
        <select
          id="payer_profile_id"
          name="payer_profile_id"
          required
          value={payerId}
          onChange={(e) => setPayerId(e.target.value)}
          className="w-full h-11 rounded-full border border-crave-brown/20 bg-crave-cream px-5 text-[15px] text-crave-brown focus:outline-none focus:ring-2 focus:ring-crave-pink"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
        {fe.payer_profile_id && (
          <p className="text-xs text-crave-brown mt-1 px-2">{fe.payer_profile_id}</p>
        )}
      </div>

      <div>
        <Label htmlFor="total_amount">Monto total ($ UYU)</Label>
        <Input
          id="total_amount"
          name="total_amount"
          inputMode="decimal"
          placeholder="1.250,00"
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          required
          aria-invalid={!!fe.total_amount}
        />
        {fe.total_amount && (
          <p className="text-xs text-crave-brown mt-1 px-2">{fe.total_amount}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          name="description"
          placeholder="Ej: Insumos para la feria"
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
          defaultValue={today()}
          required
        />
      </div>

      <div>
        <Label>Participantes</Label>
        <div className="grid grid-cols-2 gap-2">
          {profiles.map((p) => {
            const checked = participants.has(p.id);
            const isPayer = p.id === payerId;
            return (
              <label
                key={p.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-all",
                  checked
                    ? "bg-crave-pink/30 border-crave-brown/30"
                    : "bg-crave-cream border-crave-brown/15 hover:border-crave-brown/30",
                )}
              >
                <input
                  type="checkbox"
                  name="participant_ids"
                  value={p.id}
                  checked={checked}
                  onChange={() => toggleParticipant(p.id)}
                  className="sr-only"
                />
                <Avatar size="sm" tone="cream" initial={p.initial} />
                <span className="text-sm font-medium truncate">
                  {p.display_name}
                  {isPayer && <span className="text-crave-brown/60"> (pagó)</span>}
                </span>
              </label>
            );
          })}
        </div>
        {fe.participant_ids && (
          <p className="text-xs text-crave-brown mt-1 px-2">{fe.participant_ids}</p>
        )}
      </div>

      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="include_payer"
            checked={includePayer}
            onChange={(e) => setIncludePayer(e.target.checked)}
            className="mt-1 h-4 w-4 accent-crave-pink"
          />
          <div>
            <p className="text-sm font-medium">El pagador también consume parte del gasto</p>
            <p className="text-xs text-crave-brown/60 mt-0.5">
              {includePayer
                ? "El total se divide entre todas las participantes (incluida la que pagó)."
                : "El pagador no consume nada; sólo las otras le deben."}
            </p>
          </div>
        </label>
      </div>

      <div>
        <Label htmlFor="note">Nota (opcional)</Label>
        <Textarea
          id="note"
          name="note"
          placeholder="Detalles, link a comprobante, etc."
          maxLength={200}
        />
      </div>

      {preview && payerProfile && (
        <div className="bg-crave-cream/80 border border-crave-brown/15 rounded-card p-4 space-y-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-crave-brown/70 mb-2">
            Se van a generar estas deudas
          </p>
          {preview.map((row, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Avatar size="sm" tone="cream" initial={row.debtor.initial} />
              <span className="font-medium">{row.debtor.display_name}</span>
              <ArrowRight size={14} className="opacity-50" />
              <Avatar size="sm" tone="cream" initial={payerProfile.initial} />
              <span className="font-medium">{payerProfile.display_name}</span>
              <span className="ml-auto font-serif">{formatUYU(row.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {state.error && (
        <p className="text-sm bg-crave-pink/40 border border-crave-pink rounded-2xl px-4 py-3">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isPending || !hasOtherParticipant}
      >
        {isPending ? "Creando…" : "Crear gasto compartido"}
      </Button>
    </form>
  );
}
