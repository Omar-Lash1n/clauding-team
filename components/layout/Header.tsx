"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { LanguageToggle } from "./LanguageToggle";
import { LogoutButton } from "./LogoutButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { UserRole } from "@/types/domain";

interface HeaderProps {
  role?: UserRole;
  className?: string;
}

export function Header({ role, className }: HeaderProps) {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-[#DCE3EA] bg-white/90 backdrop-blur-sm",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-bold text-[#3E7D60] text-lg"
        >
          <span className="hidden sm:inline">{t("appName")}</span>
          <span className="sm:hidden">عيون</span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          {role && (
            <>
              <NotificationBell />
              <LogoutButton showLabel={false} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
