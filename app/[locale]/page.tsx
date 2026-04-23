import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { LandingMap } from "./LandingMap";

export default async function LandingPage() {
  const locale = await getLocale();
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  return (
    <div className="relative min-h-screen bg-[#F0F7FF] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#DCE3EA] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <span className="font-bold text-[#3E7D60] text-xl font-rubik">
            {tc("appName")}
          </span>
          <LanguageToggle />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="inline-flex items-center rounded-full bg-[#3E7D60]/10 px-4 py-1.5 text-sm text-[#3E7D60] font-medium">
              أسوان، مصر · Aswan, Egypt
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold text-[#1C2D5B] leading-tight">
              {t("heroTitle")}
            </h1>

            <p className="text-lg sm:text-xl text-[#1C2D5B]/70 max-w-2xl leading-relaxed">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href={`/${locale}/signup`}>{t("cta")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href={`/${locale}/login`}>{t("staffLogin")}</Link>
              </Button>
            </div>

            <Link
              href={`/${locale}/demo`}
              className="text-sm text-[#3E7D60] hover:underline underline-offset-4"
            >
              {t("demo")} →
            </Link>
          </div>
        </section>

        {/* Feature pillars */}
        <section className="mx-auto max-w-5xl px-4 pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white border border-[#DCE3EA] shadow-card p-6">
              <p className="text-base text-[#1C2D5B]/80 leading-relaxed">{t("pitch1")}</p>
            </div>
            <div className="rounded-2xl bg-white border border-[#DCE3EA] shadow-card p-6">
              <p className="text-base text-[#1C2D5B]/80 leading-relaxed">{t("pitch2")}</p>
            </div>
          </div>
        </section>

        {/* Map preview */}
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <p className="text-xs text-[#1C2D5B]/40 mb-2 text-center">{t("mapPreview")}</p>
          <div className="h-48 sm:h-64 rounded-2xl overflow-hidden border border-[#DCE3EA] shadow-card">
            <LandingMap />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DCE3EA] bg-[#1C2D5B] text-white py-6">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-sm opacity-70">{tc("appName")} © {new Date().getFullYear()}</span>
          <span className="text-xs opacity-50">Aswan Governorate Digital Services</span>
        </div>
      </footer>
    </div>
  );
}
