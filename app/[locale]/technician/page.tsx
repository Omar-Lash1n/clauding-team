import { createServerSupabase } from "@/lib/supabase/server";
import { getMyTasks, getCompletedThisWeek } from "@/lib/technician/queries";
import { getTranslations } from "next-intl/server";
import { TaskCard } from "@/components/technician/TaskCard";
import { formatSlaRemaining, isSlaBreached } from "@/lib/staff/report-views";
import { ClipboardCheck, AlertTriangle, Clock, CheckCircle } from "lucide-react";

interface TechnicianPageProps {
  params: Promise<{ locale: string }>;
}

export default async function TechnicianDashboard({ params }: TechnicianPageProps) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations({ locale, namespace: "technician" });

  const tasks = await getMyTasks(supabase);
  const completedThisWeek = await getCompletedThisWeek(supabase);

  // Group tasks
  const activeTasks = tasks.filter((task) =>
    ["assigned", "in_progress"].includes(task.status)
  );

  const assignedTasks = tasks.filter((task) => task.status === "assigned");
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");

  // Urgent: < 60min remaining but not breached
  const urgentTasks = activeTasks.filter((task) => {
    const deadline = task.status === "assigned" ? task.sla_pickup_deadline : task.sla_resolve_deadline;
    const info = formatSlaRemaining(deadline);
    return info && info.urgent && !info.breached;
  });

  // Breached
  const breachedTasks = activeTasks.filter((task) => {
    const deadline = task.status === "assigned" ? task.sla_pickup_deadline : task.sla_resolve_deadline;
    return isSlaBreached(deadline);
  });

  // Due today
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const dueToday = activeTasks.filter((task) => {
    const deadline = task.sla_resolve_deadline;
    if (!deadline) return false;
    const d = new Date(deadline);
    return d <= endOfDay && d >= now;
  });

  function getCategoryName(task: typeof tasks[0]) {
    const cat = task.category as { name_ar?: string; name_en?: string } | null;
    if (!cat) return "";
    return locale === "ar" ? (cat.name_ar || cat.name_en || "") : (cat.name_en || "");
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("dashboard.title")}</h1>
        <p className="text-sm text-navy/50 mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="h-4 w-4 text-nile-green" />
          </div>
          <p className="text-2xl font-bold text-navy">{activeTasks.length}</p>
          <p className="text-xs text-navy/50">{t("kpis.activeTasks")}</p>
        </div>
        <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-navy">{dueToday.length}</p>
          <p className="text-xs text-navy/50">{t("kpis.dueToday")}</p>
        </div>
        <div className="rounded-xl border border-border-neutral bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-navy">{completedThisWeek}</p>
          <p className="text-xs text-navy/50">{t("kpis.completedThisWeek")}</p>
        </div>
      </div>

      {/* Urgent tasks */}
      {urgentTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-navy">{t("urgent.title")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {urgentTasks.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                categoryName={getCategoryName(task)}
                priority={task.priority}
                status={task.status}
                addressDescription={task.address_description}
                slaPickupDeadline={task.sla_pickup_deadline}
                slaResolveDeadline={task.sla_resolve_deadline}
              />
            ))}
          </div>
        </div>
      )}

      {/* Breached tasks */}
      {breachedTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="text-lg font-semibold text-red-600">{t("breached.title")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {breachedTasks.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                categoryName={getCategoryName(task)}
                priority={task.priority}
                status={task.status}
                addressDescription={task.address_description}
                slaPickupDeadline={task.sla_pickup_deadline}
                slaResolveDeadline={task.sla_resolve_deadline}
              />
            ))}
          </div>
        </div>
      )}

      {/* Assigned tasks */}
      {assignedTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy mb-3">{t("sections.assigned")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assignedTasks.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                categoryName={getCategoryName(task)}
                priority={task.priority}
                status={task.status}
                addressDescription={task.address_description}
                slaPickupDeadline={task.sla_pickup_deadline}
                slaResolveDeadline={task.sla_resolve_deadline}
              />
            ))}
          </div>
        </div>
      )}

      {/* In progress tasks */}
      {inProgressTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy mb-3">{t("sections.inProgress")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                categoryName={getCategoryName(task)}
                priority={task.priority}
                status={task.status}
                addressDescription={task.address_description}
                slaPickupDeadline={task.sla_pickup_deadline}
                slaResolveDeadline={task.sla_resolve_deadline}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activeTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-sand-ivory text-4xl">
            ☕
          </div>
          <h3 className="text-lg font-semibold text-navy">{t("emptyState.title")}</h3>
          <p className="text-sm text-navy/50 mt-1">{t("emptyState.subtitle")}</p>
        </div>
      )}
    </div>
  );
}
