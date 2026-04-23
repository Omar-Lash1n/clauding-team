"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  User,
  Map,
  Settings,
  Wrench,
  CalendarOff,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/types/domain";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ElementType;
}

function getNavItems(role: UserRole, locale: string): NavItem[] {
  const base = `/${locale}`;
  switch (role) {
    case "citizen":
      return [
        { labelKey: "citizen.nav.dashboard", href: `${base}/citizen`, icon: LayoutDashboard },
        { labelKey: "citizen.nav.reports", href: `${base}/citizen/reports`, icon: ClipboardList },
        { labelKey: "citizen.nav.notifications", href: `${base}/citizen/notifications`, icon: Bell },
        { labelKey: "citizen.nav.profile", href: `${base}/citizen/profile`, icon: User },
      ];
    case "technician":
      return [
        { labelKey: "technician.nav.dashboard", href: `${base}/technician`, icon: LayoutDashboard },
        { labelKey: "technician.nav.leave", href: `${base}/technician/leave`, icon: CalendarOff },
        { labelKey: "technician.nav.notifications", href: `${base}/technician/notifications`, icon: Bell },
      ];
    case "district_manager":
      return [
        { labelKey: "manager.nav.dashboard", href: `${base}/manager`, icon: LayoutDashboard },
        { labelKey: "manager.nav.reports", href: `${base}/manager/reports`, icon: ClipboardList },
        { labelKey: "manager.nav.technicians", href: `${base}/manager/technicians`, icon: Wrench },
      ];
    case "governor":
      return [
        { labelKey: "governor.nav.dashboard", href: `${base}/governor`, icon: LayoutDashboard },
        { labelKey: "governor.nav.situation", href: `${base}/governor/situation-room`, icon: Map },
        { labelKey: "governor.nav.reports", href: `${base}/governor/reports`, icon: ClipboardList },
        { labelKey: "governor.nav.settings", href: `${base}/governor/settings`, icon: Settings },
        { labelKey: "governor.nav.notifications", href: `${base}/governor/notifications`, icon: Bell },
      ];
  }
}

interface RoleNavProps {
  role: UserRole;
}

export function RoleNav({ role }: RoleNavProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const tCitizen = useTranslations("citizen");
  const tTech = useTranslations("technician");
  const tManager = useTranslations("manager");
  const tGovernor = useTranslations("governor");

  const items = getNavItems(role, locale);

  function getLabel(key: string): string {
    const [ns, ...rest] = key.split(".");
    const path = rest.join(".");
    try {
      if (ns === "citizen") return tCitizen(path as Parameters<typeof tCitizen>[0]);
      if (ns === "technician") return tTech(path as Parameters<typeof tTech>[0]);
      if (ns === "manager") return tManager(path as Parameters<typeof tManager>[0]);
      if (ns === "governor") return tGovernor(path as Parameters<typeof tGovernor>[0]);
    } catch {
      // fallback to last segment
    }
    return rest[rest.length - 1] ?? key;
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-56 shrink-0 border-e border-[#DCE3EA] bg-white pt-6 pb-4 px-3 gap-1 min-h-[calc(100vh-4rem)]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#3E7D60]/10 text-[#3E7D60]"
                  : "text-[#1C2D5B]/60 hover:bg-[#F0F7FF] hover:text-[#1C2D5B]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{getLabel(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 start-0 end-0 z-40 flex h-16 items-center justify-around border-t border-[#DCE3EA] bg-white px-2">
        {items.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
                isActive ? "text-[#3E7D60]" : "text-[#1C2D5B]/40 hover:text-[#1C2D5B]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="sr-only">{getLabel(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
