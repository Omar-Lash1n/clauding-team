"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/domain";

export function ToastHandler() {
  const locale = useLocale();

  useEffect(() => {
    const supabase = createClient();
    let userId: string | undefined;

    async function subscribe() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const notification = payload.new as Notification;
            const title =
              locale === "ar"
                ? notification.title_ar
                : notification.title_en;
            const body =
              locale === "ar"
                ? notification.body_ar
                : notification.body_en;

            toast(title, {
              description: body ?? undefined,
              action: notification.link_url
                ? {
                    label: locale === "ar" ? "عرض" : "View",
                    onClick: () => {
                      window.location.href = `/${locale}${notification.link_url}`;
                    },
                  }
                : undefined,
              duration: 6000,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    const cleanup = subscribe();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [locale]);

  return null;
}
