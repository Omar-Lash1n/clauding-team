import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/staff/queries";
import { Header } from "@/components/layout/Header";
import { RoleNav } from "@/components/layout/RoleNav";

interface TechnicianLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function TechnicianLayout({
  children,
  params,
}: TechnicianLayoutProps) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile(supabase);

  if (!profile || profile.role !== "technician") {
    redirect(`/${locale}/login`);
  }

  // Check for substitute info
  let substituteForName: string | null = null;
  let substituteEndDate: string | null = null;

  if (profile.substitute_for_user_id) {
    const { data: originalTech } = await supabase
      .from("profiles")
      .select("full_name, full_name_ar")
      .eq("id", profile.substitute_for_user_id)
      .single();

    if (originalTech) {
      substituteForName = locale === "ar"
        ? (originalTech.full_name_ar || originalTech.full_name)
        : originalTech.full_name;
    }

    // Find the leave end date
    const { data: leave } = await supabase
      .from("leave_requests")
      .select("end_date")
      .eq("technician_id", profile.substitute_for_user_id)
      .eq("status", "approved" as const)
      .order("end_date", { ascending: false })
      .limit(1)
      .single();

    if (leave) {
      substituteEndDate = leave.end_date;
    }
  }

  return (
    <div className="min-h-screen bg-sky-white">
      <Header role="technician" />

      {/* On Leave Banner */}
      {profile.is_on_leave && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="mx-auto max-w-7xl flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 text-amber-800 text-lg">
              🏖
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-800" data-key="onLeaveBanner.title">
                {locale === "ar" ? "أنت حالياً في إجازة" : "You are currently on leave"}
              </p>
              <p className="text-xs text-amber-700" data-key="onLeaveBanner.subtitle">
                {locale === "ar" ? "تواصل مع مديرك لأي استفسار" : "Contact your manager for any concerns"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Substitute Badge */}
      {substituteForName && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="mx-auto max-w-7xl flex items-center gap-2">
            <span className="inline-flex rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800">
              {locale === "ar" ? "مهمة بديل" : "Substitute Duty"}
            </span>
            <span className="text-xs text-blue-700">
              {locale === "ar"
                ? `أنت تغطي حالياً عن ${substituteForName}${substituteEndDate ? ` حتى ${substituteEndDate}` : ""}`
                : `You are currently covering for ${substituteForName}${substituteEndDate ? ` until ${substituteEndDate}` : ""}`}
            </span>
          </div>
        </div>
      )}

      <div className="flex">
        <RoleNav role="technician" />
        <main className="flex-1 px-4 py-6 sm:px-6 pb-20 md:pb-6">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
