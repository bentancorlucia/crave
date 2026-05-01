import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app/app-header";
import { BottomNav } from "@/components/app/bottom-nav";
import { Sidebar } from "@/components/app/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-[100dvh] pb-28 lg:pb-12 lg:pl-64">
      <Sidebar />
      <AppHeader profile={profile ?? { display_name: "?", initial: "?", id: user.id }} />
      <div className="w-full max-w-7xl mx-auto px-5">{children}</div>
      <BottomNav />
    </div>
  );
}
