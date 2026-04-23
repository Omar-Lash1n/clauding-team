import { getTranslations } from "next-intl/server";
import { Bell } from "lucide-react";
import { NotificationInbox } from "@/components/notifications/NotificationInbox";

interface NotificationsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ManagerNotificationsPage({ params }: NotificationsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notifications" });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-navy" />
        <h1 className="text-2xl font-bold text-navy">{t("bellTitle")}</h1>
      </div>
      <NotificationInbox />
    </div>
  );
}
