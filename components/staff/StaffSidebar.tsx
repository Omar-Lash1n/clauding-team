"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  Users,
  CalendarOff,
  AlertTriangle,
  Globe,
  Inbox,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/types/domain";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

function getManagerNavItems(locale: string): NavItem[] {
  const base = `/${locale}/manager`;
  return [
    { labelKey: "dashboard", href: base, icon: LayoutDashboard },
    { labelKey: "queue", href: `${base}/queue`, icon: Inbox },
    { labelKey: "reports", href: `${base}/reports`, icon: ClipboardList },
    { labelKey: "technicians", href: `${base}/technicians`, icon: Users },
    { labelKey: "leaveRequests", href: `${base}/leave-requests`, icon: CalendarOff },
    { labelKey: "disputes", href: `${base}/disputes`, icon: AlertTriangle },
    { labelKey: "crossDistrict", href: `${base}/cross-district`, icon: Globe },
    { labelKey: "notifications", href: `${base}/notifications`, icon: Bell },
  ];
}

function getTechnicianNavItems(locale: string): NavItem[] {
  const base = `/${locale}/technician`;
  return [
    { labelKey: "dashboard", href: base, icon: LayoutDashboard },
    { labelKey: "leave", href: `${base}/leave`, icon: CalendarOff },
    { labelKey: "notifications", href: `${base}/notifications`, icon: Bell },
  ];
}

interface StaffSidebarProps {
  role: UserRole;
  crossDistrictActive?: boolean;
}

export function StaffSidebar({ role, crossDistrictActive }: StaffSidebarProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const tManager = useTranslations("manager");
  const tTech = useTranslations("technician");

  const items =
    role === "district_manager"
      ? getManagerNavItems(locale)
      : getTechnicianNavItems(locale);

  function getLabel(key: string): string {
    try {
      if (role === "district_manager") {
        return tManager(`nav.${key}` as Parameters<typeof tManager>[0]);
      }
      return tTech(`nav.${key}` as Parameters<typeof tTech>[0]);
    } catch {
      return key;
    }
  }

  return (
    <nav className="hidden md:flex flex-col w-60 shrink-0 border-e border-border-neutral bg-white pt-6 pb-4 px-3 gap-1 min-h-[calc(100vh-4rem)]">
      {/* Role title */}
      <div className="px-3 pb-4 mb-2 border-b border-border-neutral">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-nile-green" />
          <span className="text-sm font-semibold text-navy">
            {role === "district_manager"
              ? tManager("dashboard.title")
              : tTech("dashboard.title")}
          </span>
        </div>
        {crossDistrictActive && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            <Globe className="h-3 w-3" />
            {tManager("crossDistrictBanner.label")}
          </span>
        )}
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== `/${locale}/manager` &&
            item.href !== `/${locale}/technician` &&
            pathname.startsWith(item.href + "/"));

        // For exact dashboard match
        const isExactDashboard =
          (item.href === `/${locale}/manager` || item.href === `/${locale}/technician`) &&
          pathname === item.href;

        const active = isActive || isExactDashboard;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-nile-green/10 text-nile-green"
                : "text-navy/60 hover:bg-sky-white hover:text-navy"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{getLabel(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
