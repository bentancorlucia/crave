import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./form";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, initial")
    .eq("id", user.id)
    .single();

  return (
    <main className="max-w-md mx-auto py-2 pb-16">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-crave-brown/70 hover:text-crave-brown mb-4"
      >
        <ChevronLeft size={16} /> Volver
      </Link>
      <h1 className="font-serif italic text-3xl md:text-4xl font-medium mb-2">
        Tu perfil
      </h1>
      <p className="text-sm text-crave-brown/70 mb-7">
        Así te vemos las demás. Poné tu nombre como te llamamos en el grupo y la inicial que va
        en tu avatar.
      </p>
      <ProfileForm
        email={user.email ?? ""}
        defaultName={profile?.display_name ?? ""}
        defaultInitial={profile?.initial ?? ""}
      />
    </main>
  );
}
