import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "ar" | "en")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
    timeZone: "Africa/Cairo",
    formats: {
      number: {
        decimal: {
          style: "decimal",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        },
        currency: {
          style: "currency",
          currency: "EGP",
        },
      },
    },
  };
});
