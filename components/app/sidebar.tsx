import { LogOut } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  return (
    <aside
      className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-crave-cream border-r border-crave-brown/10 px-5 py-8 z-40"
      aria-label="Barra lateral"
    >
      <div className="px-2 mb-10">
        <Wordmark />
      </div>

      <div className="flex-1">
        <SidebarNav />
      </div>

      <form action="/logout" method="post" className="mt-6">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-crave-brown/60 hover:text-crave-brown hover:bg-crave-brown/5 transition-all btn-press text-[14px] font-medium"
        >
          <LogOut size={18} />
          <span>Cerrar sesión</span>
        </button>
      </form>
    </aside>
  );
}
