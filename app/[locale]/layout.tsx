import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import { ToastHandler } from "@/components/notifications/ToastHandler";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "عيون النيل | Oyoun El Nile",
  description:
    "منصة الإبلاغ عن مشكلات البنية التحتية في أسوان | Infrastructure reporting platform for Aswan, Egypt",
  icons: {
    icon: "/favicon.ico",
  },
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "ar" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
          <ToastHandler />
          <Toaster
            position={locale === "ar" ? "bottom-right" : "bottom-left"}
            richColors
            closeButton
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
