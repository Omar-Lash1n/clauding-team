"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function toggle() {
    const next = locale === "ar" ? "en" : "ar";
    // Replace the locale prefix in the path
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-1.5 text-[#1C2D5B]/70 hover:text-[#3E7D60]"
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">{locale === "ar" ? "EN" : "ع"}</span>
    </Button>
  );
}
