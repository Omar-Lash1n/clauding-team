"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { User, Shield, Wrench, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { selectRoleAction } from "./actions";
import type { UserRole } from "@/types/domain";

const ROLES: {
  role: UserRole;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  { role: "governor", icon: Building2, color: "text-[#1C2D5B]", bg: "bg-[#1C2D5B]/10" },
  { role: "district_manager", icon: Shield, color: "text-[#3E7D60]", bg: "bg-[#3E7D60]/10" },
  { role: "technician", icon: Wrench, color: "text-[#D9A441]", bg: "bg-[#D9A441]/10" },
  { role: "citizen", icon: User, color: "text-[#3E7D60]", bg: "bg-[#C7E1D4]/30" },
];

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const tr = useTranslations("roles");
  const locale = useLocale();
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);

  async function handleSelect(role: UserRole) {
    setLoadingRole(role);
    await selectRoleAction(role, locale);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F7FF] px-4 py-8">
      <div className="absolute top-4 end-4">
        <LanguageToggle />
      </div>

      <Link href={`/${locale}`} className="mb-6 text-2xl font-bold text-[#3E7D60] font-rubik">
        {tc("appName")}
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#1C2D5B] mb-2">{t("loginTitle")}</h1>
          <p className="text-[#1C2D5B]/60 text-sm">
            {t("loginSubtitle") || "Choose your role to continue"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {ROLES.map(({ role, icon: Icon, color, bg }) => (
            <Card
              key={role}
              className="cursor-pointer hover:shadow-card-hover transition-shadow"
            >
              <CardContent className="p-0">
                <button
                  onClick={() => handleSelect(role)}
                  disabled={!!loadingRole}
                  className="w-full flex items-center gap-4 p-5 text-start"
                >
                  <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#1C2D5B]">{tr(role)}</p>
                    <p className="text-xs text-[#1C2D5B]/50 mt-0.5">
                      {t("loginAs") || "Enter as"} {tr(role)}
                    </p>
                  </div>
                  {loadingRole === role && (
                    <span className="text-xs text-[#3E7D60] animate-pulse">{tc("loading")}</span>
                  )}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
