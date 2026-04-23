"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Notification } from "@/types/domain";

export function NotificationInbox() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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
        .limit(50);

      if (data) setNotifications(data);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return <EmptyState icon={Bell} title={t("empty")} />;
  }

  return (
    <div className="divide-y divide-[#DCE3EA]">
      {notifications.map((n) => {
        const title = locale === "ar" ? n.title_ar : n.title_en;
        const body = locale === "ar" ? n.body_ar : n.body_en;

        const row = (
          <div
            className={cn(
              "flex gap-3 px-4 py-4 transition-colors hover:bg-[#F0F7FF]",
              !n.is_read && "bg-[#F0F7FF]/60"
            )}
          >
            {!n.is_read && (
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#3E7D60]" />
            )}
            <div className={cn("flex-1", n.is_read && "ms-5")}>
              <p className={cn("text-sm text-[#1C2D5B]", !n.is_read && "font-medium")}>
                {title}
              </p>
              {body && (
                <p className="mt-0.5 text-sm text-[#1C2D5B]/60">{body}</p>
              )}
              <p className="mt-1 text-xs text-[#1C2D5B]/40">
                {formatRelative(n.created_at, locale)}
              </p>
            </div>
          </div>
        );

        if (n.link_url) {
          return (
            <Link key={n.id} href={`/${locale}${n.link_url}`}>
              {row}
            </Link>
          );
        }
        return <div key={n.id}>{row}</div>;
      })}
    </div>
  );
}
