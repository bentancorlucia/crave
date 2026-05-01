"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { updateProfile, type UpdateProfileState } from "./actions";

export function ProfileForm({
  email,
  defaultName,
  defaultInitial,
}: {
  email: string;
  defaultName: string;
  defaultInitial: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<UpdateProfileState, FormData>(
    updateProfile,
    {},
  );
  const [name, setName] = useState(defaultName);
  const [initial, setInitial] = useState(defaultInitial);

  // Auto-suggest inicial cuando cambia el nombre y la inicial estaba vacía
  useEffect(() => {
    if (!initial && name) setInitial(name.trim().charAt(0).toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  // Redirigir tras guardar
  useEffect(() => {
    if (state.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state.ok, router]);

  const fe = state.fieldErrors ?? {};

  return (
    <form
      action={formAction}
      className="space-y-6 bg-crave-blue/40 border border-crave-brown/15 rounded-card p-6"
    >
      <div className="flex items-center gap-4">
        <Avatar size="lg" tone="cream" initial={initial || "?"} />
        <div className="text-sm text-crave-brown/70">
          <p className="font-medium text-crave-brown">{email}</p>
          <p>Así se ve tu avatar.</p>
        </div>
      </div>

      <div>
        <Label htmlFor="display_name">Cómo te llamamos</Label>
        <Input
          id="display_name"
          name="display_name"
          required
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bentis"
          aria-invalid={!!fe.display_name}
        />
        {fe.display_name && (
          <p className="text-xs text-crave-brown mt-1 px-2">{fe.display_name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="initial">Inicial del avatar</Label>
        <Input
          id="initial"
          name="initial"
          required
          maxLength={2}
          value={initial}
          onChange={(e) => setInitial(e.target.value.toUpperCase())}
          className="uppercase"
          placeholder="B"
          aria-invalid={!!fe.initial}
        />
        {fe.initial && <p className="text-xs text-crave-brown mt-1 px-2">{fe.initial}</p>}
      </div>

      {state.error && (
        <p className="text-sm bg-crave-pink/40 border border-crave-pink rounded-2xl px-4 py-3">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
