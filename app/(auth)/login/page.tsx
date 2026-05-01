import { Suspense } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Wordmark className="text-5xl inline-block" />
          <p className="font-serif italic text-lg text-crave-brown/70 mt-3">
            hub interno · finanzas
          </p>
        </div>
        <div className="bg-crave-blue/60 backdrop-blur border border-crave-brown/15 rounded-hero p-8 shadow-soft">
          <h2 className="font-serif italic text-2xl font-medium mb-1">Hola de nuevo</h2>
          <p className="text-sm text-crave-brown/70 mb-7">Entrá con tu mail y contraseña.</p>
          <Suspense fallback={<div className="h-72" />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="text-center text-xs text-crave-brown/50 mt-6">
          ¿No tenés acceso? Pedile a Bentis que te invite.
        </p>
      </div>
    </main>
  );
}
