"use client";

import { useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { markAllNotificationsRead } from "@/lib/governor/actions";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils/format";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Notification } from "@/types/domain";

interface NotificationsClientProps {
  notifications: Notification[];
}

export function NotificationsClient({ notifications }: NotificationsClientProps) {
  const t = useTranslations("governor.notifications");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      toast.success(t("markAllRead"));
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-border-neutral bg-sand-ivory/30 p-8 text-center">
        <Bell className="h-8 w-8 text-navy/20 mx-auto mb-3" />
        <p className="text-sm text-navy/50">{t("empty")}</p>
      </div>
    );
  }

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-nile-green"
          >
            <CheckCheck className="h-4 w-4 me-1" />
            {t("markAllRead")}
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-border-neutral bg-white shadow-card divide-y divide-border-neutral">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={cn(
              "px-5 py-4 transition-colors",
              !notif.is_read && "bg-sky-white"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy">
                  {locale === "ar" ? notif.title_ar : notif.title_en}
                </p>
                {(notif.body_ar || notif.body_en) && (
                  <p className="text-xs text-navy/60 mt-1">
                    {locale === "ar" ? notif.body_ar : notif.body_en}
                  </p>
                )}
              </div>
              <span className="text-xs text-navy/40 whitespace-nowrap">
                {formatRelative(notif.created_at, locale)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
