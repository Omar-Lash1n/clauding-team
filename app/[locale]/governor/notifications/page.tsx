import { getTranslations, getLocale } from "next-intl/server";
import { getGovernorNotifications } from "@/lib/governor/queries";
import { NotificationsClient } from "@/components/governor/NotificationsClient";

export default async function GovernorNotificationsPage() {
  const t = await getTranslations("governor.notifications");
  const notifications = await getGovernorNotifications();

  return (
    <div className="p-4 md:p-8 max-w-3xl space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-navy">{t("title")}</h1>
      <NotificationsClient notifications={notifications} />
    </div>
  );
}
