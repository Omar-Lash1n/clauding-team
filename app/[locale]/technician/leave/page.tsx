import { createServerSupabase } from "@/lib/supabase/server";
import { getMyLeaveRequests } from "@/lib/technician/queries";
import { getTranslations } from "next-intl/server";
import { LeaveRequestCard } from "@/components/technician/LeaveRequestCard";
import { LeaveRequestForm } from "@/components/technician/LeaveRequestForm";
import { CalendarPlus } from "lucide-react";
import type { LeaveStatus, SpecialtyType } from "@/types/domain";

interface LeavePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LeavePage({ params }: LeavePageProps) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "technician" });

  const leaveRequests = await getMyLeaveRequests(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("leave.title")}</h1>
        </div>
      </div>

      {/* Leave request form */}
      <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <CalendarPlus className="h-5 w-5 text-nile-green" />
          <h2 className="text-lg font-semibold text-navy">{t("leave.requestNew")}</h2>
        </div>
        <LeaveRequestForm />
      </div>

      {/* Leave requests list */}
      <div className="space-y-3">
        {leaveRequests.length === 0 ? (
          <div className="rounded-xl border border-border-neutral bg-white p-8 text-center shadow-card">
            <p className="text-sm text-navy/50">{t("leave.noRequests")}</p>
          </div>
        ) : (
          leaveRequests.map((leave) => {
            const sub = leave.substitute as {
              full_name?: string;
              full_name_ar?: string | null;
              specialty?: SpecialtyType | null;
            } | null;

            return (
              <LeaveRequestCard
                key={leave.id}
                id={leave.id}
                startDate={leave.start_date}
                endDate={leave.end_date}
                reason={leave.reason}
                status={leave.status as LeaveStatus}
                substituteName={sub?.full_name || null}
                substituteNameAr={sub?.full_name_ar || null}
                substituteSpecialty={sub?.specialty || null}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
