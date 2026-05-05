"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Handshake, User, ClipboardList, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard",   label: "Inicio",      Icon: Home },
  { href: "/pedidos",     label: "Pedidos",     Icon: ClipboardList },
  { href: "/cocina",      label: "Cocina",      Icon: ChefHat },
  { href: "/movimientos", label: "Movim.",      Icon: ListChecks },
  { href: "/deudas",      label: "Deudas",      Icon: Handshake },
  { href: "/perfil",      label: "Perfil",      Icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm bg-crave-cream/90 backdrop-blur-xl border border-crave-brown/15 shadow-dock rounded-full px-2 py-2 flex justify-between z-50"
      aria-label="Navegación principal"
    >
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-full transition-all btn-press",
              active
                ? "bg-crave-pink/30 text-crave-brown"
                : "text-crave-brown/60 hover:text-crave-brown",
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
            <span className={cn("text-[9px]", active ? "font-bold" : "font-medium")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
