import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { RoleNav } from "@/components/layout/RoleNav";
import type { UserRole } from "@/types/domain";
import { ROLE_DASHBOARDS } from "@/types/domain";

interface CitizenLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function CitizenLayout({
  children,
  params,
}: CitizenLayoutProps) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();

  if (!profile || profile.role !== "citizen") {
    const rolePath = ROLE_DASHBOARDS[profile?.role ?? "citizen"];
    redirect(`/${locale}${rolePath}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header role="citizen" />
      <div className="flex flex-1">
        <RoleNav role="citizen" />
        <main className="flex-1 mx-auto max-w-3xl px-4 py-6 pb-20 md:pb-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
