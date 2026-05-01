"use client";

import { useActionState, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { createTransfer, type TransferState } from "./actions";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Profile = { id: string; display_name: string; initial: string };

export function TransferForm({ profiles }: { profiles: Profile[] }) {
  const [state, formAction, isPending] = useActionState<TransferState, FormData>(
    createTransfer,
    {},
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fe = state.fieldErrors ?? {};
  const fromProfile = profiles.find((p) => p.id === from);
  const toProfile = profiles.find((p) => p.id === to);

  return (
    <form
      action={formAction}
      className="space-y-6 bg-crave-blue/40 border border-crave-brown/15 rounded-card p-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:items-end">
        <div>
          <Label htmlFor="from_profile_id">Quién paga</Label>
          <select
            id="from_profile_id"
            name="from_profile_id"
            required
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full h-11 rounded-full border border-crave-brown/20 bg-crave-cream px-5 text-[15px] text-crave-brown focus:outline-none focus:ring-2 focus:ring-crave-pink"
            aria-invalid={!!fe.from_profile_id}
          >
            <option value="">Elegí…</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === to}>
                {p.display_name}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden sm:flex h-11 items-center justify-center text-crave-brown/50">
          <ArrowRight size={20} />
        </div>

        <div>
          <Label htmlFor="to_profile_id">Quién recibe</Label>
          <select
            id="to_profile_id"
            name="to_profile_id"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full h-11 rounded-full border border-crave-brown/20 bg-crave-cream px-5 text-[15px] text-crave-brown focus:outline-none focus:ring-2 focus:ring-crave-pink"
            aria-invalid={!!fe.to_profile_id}
          >
            <option value="">Elegí…</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === from}>
                {p.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {fe.to_profile_id && <p className="text-xs text-crave-brown px-2 -mt-2">{fe.to_profile_id}</p>}

      {fromProfile && toProfile && (
        <div className="flex items-center gap-2 px-1 text-sm text-crave-brown/70">
          <Avatar size="sm" tone="cream" initial={fromProfile.initial} />
          <span className="font-medium text-crave-brown">{fromProfile.display_name}</span>
          <ArrowRight size={14} className="opacity-40" />
          <Avatar size="sm" tone="cream" initial={toProfile.initial} />
          <span className="font-medium text-crave-brown">{toProfile.display_name}</span>
        </div>
      )}

      <div>
        <Label htmlFor="amount">Monto ($ UYU)</Label>
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          placeholder="1.250,00"
          required
          aria-invalid={!!fe.amount}
        />
        {fe.amount && <p className="text-xs text-crave-brown mt-1 px-2">{fe.amount}</p>}
      </div>

      <div>
        <Label htmlFor="paid_on">Fecha</Label>
        <Input id="paid_on" name="paid_on" type="date" defaultValue={today()} required />
      </div>

      <div>
        <Label htmlFor="note">Nota (opcional)</Label>
        <Input id="note" name="note" placeholder="Mi Dinero, transferencia bancaria, efectivo…" />
      </div>

      {state.error && (
        <p className="text-sm bg-crave-pink/40 border border-crave-pink rounded-2xl px-4 py-3">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Guardando…" : "Registrar transferencia"}
      </Button>
    </form>
  );
}
