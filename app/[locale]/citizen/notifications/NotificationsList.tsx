"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/citizen/actions";
import { formatRelative } from "@/lib/utils/format";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Notification } from "@/types/domain";

interface NotificationsListProps {
  notifications: Notification[];
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const t = useTranslations("citizen.notifications");
  const locale = useLocale();
  const router = useRouter();

  const hasUnread = notifications.some((n) => !n.is_read);

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    router.refresh();
  }

  async function handleClick(notification: Notification) {
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
    }
    if (notification.link_url) {
      router.push(notification.link_url);
    }
    router.refresh();
  }

  if (notifications.length === 0) {
    return <EmptyState icon={Bell} title={t("empty")} />;
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
            {t("markAllRead")}
          </Button>
        </div>
      )}

      <div className="space-y-1">
        {notifications.map((n) => {
          const title = locale === "ar" ? n.title_ar : n.title_en;
          const body = locale === "ar" ? n.body_ar : n.body_en;

          return (
            <button
              key={n.id}
              type="button"
              onClick={() => handleClick(n)}
              className={cn(
                "w-full text-start rounded-xl p-4 transition-colors",
                n.is_read
                  ? "bg-white hover:bg-[#F0F7FF]"
                  : "bg-[#F0F7FF] hover:bg-[#C7E1D4]/20"
              )}
            >
              <div className="flex items-start gap-3">
                {!n.is_read && (
                  <div className="h-2 w-2 rounded-full bg-[#3E7D60] shrink-0 mt-2" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1C2D5B] truncate">
                    {title}
                  </p>
                  {body && (
                    <p className="text-xs text-[#1C2D5B]/60 mt-0.5 line-clamp-2">
                      {body}
                    </p>
                  )}
                  <p className="text-xs text-[#1C2D5B]/40 mt-1">
                    {formatRelative(n.created_at, locale)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
