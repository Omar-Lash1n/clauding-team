"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface LogoutButtonProps {
  variant?: "ghost" | "outline" | "default";
  showLabel?: boolean;
}

export function LogoutButton({ variant = "ghost", showLabel = true }: LogoutButtonProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <Button
      variant={variant}
      size={showLabel ? "default" : "icon"}
      onClick={handleLogout}
      disabled={loading}
      className="gap-2 text-[#1C2D5B]/70 hover:text-[#C94C4C]"
    >
      <LogOut className="h-4 w-4" />
      {showLabel && <span>{t("logout")}</span>}
    </Button>
  );
}
