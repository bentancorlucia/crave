"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("No pudimos entrar. Revisá mail y contraseña.");
      return;
    }
    const next = params.get("next") || "/dashboard";
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vos@crave.com"
        />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-sm text-crave-brown bg-crave-pink/40 border border-crave-pink rounded-2xl px-4 py-3">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
