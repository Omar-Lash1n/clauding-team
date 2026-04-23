import { getLocale, getTranslations } from "next-intl/server";
import { getMyNotifications } from "@/lib/citizen/queries";
import { NotificationsList } from "./NotificationsList";

export default async function NotificationsPage() {
  const locale = await getLocale();
  const t = await getTranslations("citizen.notifications");
  const notifications = await getMyNotifications(50);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-[#1C2D5B]">{t("title")}</h1>
      <NotificationsList notifications={notifications} />
    </div>
  );
}
