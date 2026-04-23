"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Map,
  BarChart3,
  Tags,
  ArrowLeftRight,
  FileText,
  Wallet,
  Bell,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LogoutButton } from "@/components/layout/LogoutButton";

interface GovernorSidebarProps {
  profileName?: string;
  profileNameAr?: string;
}

const NAV_ITEMS = [
  { key: "dashboard", href: "", icon: LayoutDashboard },
  { key: "situation", href: "/situation-room", icon: Map },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
  { key: "categories", href: "/categories", icon: Tags },
  { key: "crossDistrict", href: "/cross-district-approvals", icon: ArrowLeftRight },
  { key: "dailySummary", href: "/daily-summary", icon: FileText },
  { key: "budget", href: "/budget", icon: Wallet },
  { key: "notifications", href: "/notifications", icon: Bell },
  { key: "profile", href: "/profile", icon: User },
] as const;

export function GovernorSidebar({ profileName, profileNameAr }: GovernorSidebarProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("governor");
  const base = `/${locale}/governor`;

  return (
    <nav className="hidden md:flex flex-col w-64 shrink-0 border-e border-border-neutral bg-white min-h-[calc(100vh-4rem)]">
      {/* City identifier */}
      <div className="px-5 pt-6 pb-4 border-b border-border-neutral">
        <p className="text-xs font-medium text-navy/50 uppercase tracking-wider">
          {t("sidebar.city")}
        </p>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const href = `${base}${item.href}`;
          const isActive =
            item.href === ""
              ? pathname === base || pathname === `${base}/`
              : pathname.startsWith(href);
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-navy/10 text-navy"
                  : "text-navy/50 hover:bg-sky-white hover:text-navy"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t(`nav.${item.key}`)}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer: user + logout */}
      <div className="border-t border-border-neutral px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy/10 text-navy text-sm font-bold">
            {(profileName ?? "G")[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-navy truncate">
              {locale === "ar" ? profileNameAr : profileName}
            </p>
            <p className="text-xs text-navy/40">{t("profile.role")}</p>
          </div>
        </div>
        <div className="mt-3">
          <LogoutButton showLabel />
        </div>
      </div>
    </nav>
  );
}
