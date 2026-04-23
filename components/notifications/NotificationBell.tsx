"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Notification } from "@/types/domain";

export function NotificationBell() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) setNotifications(data);
      setLoading(false);
    }

    load();
  }, []);

  async function markAllRead() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-[#1C2D5B]/70">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C94C4C] text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className="font-semibold text-[#1C2D5B] text-sm">{t("bellTitle")}</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="h-7 gap-1 text-xs text-[#3E7D60]"
            >
              <CheckCheck className="h-3 w-3" />
              {t("markAllRead")}
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Bell className="h-6 w-6 text-[#1C2D5B]/20" />
              <p className="text-sm text-[#1C2D5B]/50">{t("empty")}</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  locale={locale}
                  onClose={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </div>
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-[#3E7D60]"
            asChild
          >
            <Link href={`/${locale}/notifications`}>{t("seeAll")}</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({
  notification,
  locale,
  onClose,
}: {
  notification: Notification;
  locale: string;
  onClose: () => void;
}) {
  const title = locale === "ar" ? notification.title_ar : notification.title_en;
  const body =
    locale === "ar" ? notification.body_ar : notification.body_en;

  const content = (
    <div
      className={cn(
        "flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-[#F0F7FF]",
        !notification.is_read && "bg-[#F0F7FF]/60"
      )}
    >
      <div className="flex items-start gap-2">
        {!notification.is_read && (
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3E7D60]" />
        )}
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm text-[#1C2D5B]", !notification.is_read && "font-medium")}>
            {title}
          </p>
          {body && (
            <p className="mt-0.5 text-xs text-[#1C2D5B]/60 line-clamp-2">{body}</p>
          )}
          <p className="mt-1 text-xs text-[#1C2D5B]/40">
            {formatRelative(notification.created_at, locale)}
          </p>
        </div>
      </div>
    </div>
  );

  if (notification.link_url) {
    return (
      <Link href={`/${locale}${notification.link_url}`} onClick={onClose}>
        {content}
      </Link>
    );
  }

  return content;
}
