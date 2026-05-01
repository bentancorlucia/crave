import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { Avatar } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

export function AppHeader({
  profile,
}: {
  profile: { id: string; display_name: string; initial: string };
}) {
  return (
    <header className="w-full max-w-7xl mx-auto px-5 pt-8 pb-6 flex items-end justify-between">
      <Wordmark className="lg:hidden" />
      <div className="flex items-center gap-3 ml-auto">
        <div className="text-right hidden sm:block">
          <p className="font-medium text-xs text-crave-brown/60">Buen día,</p>
          <p className="font-serif italic text-base leading-none mt-0.5">
            Hola, {profile.display_name}
          </p>
        </div>
        <Link
          href="/perfil"
          aria-label="Editar mi perfil"
          className="rounded-full hover:opacity-80 transition-opacity"
        >
          <Avatar initial={profile.initial} size="lg" tone="blue" />
        </Link>
        <form action="/logout" method="post" className="lg:hidden">
          <button
            type="submit"
            aria-label="Cerrar sesión"
            className="h-10 w-10 rounded-full bg-crave-cream border border-crave-brown/15 inline-flex items-center justify-center text-crave-brown/60 hover:text-crave-brown btn-press"
          >
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </header>
  );
}
