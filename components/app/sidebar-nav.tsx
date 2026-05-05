"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Handshake, User, ClipboardList, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard",   label: "Inicio",      Icon: Home },
  { href: "/pedidos",     label: "Pedidos",     Icon: ClipboardList },
  { href: "/cocina",      label: "Cocina",      Icon: ChefHat },
  { href: "/movimientos", label: "Movimientos", Icon: ListChecks },
  { href: "/deudas",      label: "Deudas",      Icon: Handshake },
  { href: "/perfil",      label: "Perfil",      Icon: User },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-1">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-full transition-all btn-press",
              active
                ? "bg-crave-pink/30 text-crave-brown font-semibold"
                : "text-crave-brown/65 hover:text-crave-brown hover:bg-crave-brown/5 font-medium",
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
            <span className="text-[15px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
