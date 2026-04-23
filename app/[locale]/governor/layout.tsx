import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { GovernorSidebar } from "@/components/governor/GovernorSidebar";
import { RoleNav } from "@/components/layout/RoleNav";

interface GovernorLayoutProps {
  children: React.ReactNode;
}

export default async function GovernorLayout({ children }: GovernorLayoutProps) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, full_name_ar")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "governor") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-sky-white">
      <Header role="governor" />
      <div className="flex">
        {/* Desktop sidebar */}
        <GovernorSidebar
          profileName={profile.full_name}
          profileNameAr={profile.full_name_ar ?? undefined}
        />
        {/* Main content */}
        <main className="flex-1 pb-20 md:pb-8">{children}</main>
      </div>
      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <RoleNav role="governor" />
      </div>
    </div>
  );
}
