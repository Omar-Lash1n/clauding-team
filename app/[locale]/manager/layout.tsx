import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/staff/queries";
import { getActiveCrossDistrictPermission } from "@/lib/manager/queries";
import { Header } from "@/components/layout/Header";
import { RoleNav } from "@/components/layout/RoleNav";
import { Globe } from "lucide-react";

interface ManagerLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ManagerLayout({
  children,
  params,
}: ManagerLayoutProps) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile(supabase);

  if (!profile || profile.role !== "district_manager") {
    redirect(`/${locale}/login`);
  }

  const crossDistrictPerms = await getActiveCrossDistrictPermission(supabase, profile.id);
  const hasCrossDistrict = crossDistrictPerms.length > 0;

  return (
    <div className="min-h-screen bg-sky-white">
      <Header role="district_manager" />

      {/* Cross-district banner */}
      {hasCrossDistrict && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="mx-auto max-w-7xl flex items-center gap-2">
            <Globe className="h-4 w-4 text-amber-700" />
            <span className="text-xs font-medium text-amber-800">
              {locale === "ar" ? "صلاحية عبر الأقسام نشطة" : "Cross-district access active"}
            </span>
          </div>
        </div>
      )}

      <div className="flex">
        <RoleNav role="district_manager" />
        <main className="flex-1 px-4 py-6 sm:px-6 pb-20 md:pb-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
