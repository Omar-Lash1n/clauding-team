import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

const CAIRO_TZ = "Africa/Cairo";

function toLocale(locale: string) {
  return locale === "ar" ? ar : enUS;
}

export function formatDate(
  date: Date | string | null | undefined,
  locale = "ar",
  pattern = "dd/MM/yyyy"
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const zoned = toZonedTime(d, CAIRO_TZ);
  return format(zoned, pattern, { locale: toLocale(locale) });
}

export function formatDateTime(
  date: Date | string | null | undefined,
  locale = "ar"
): string {
  return formatDate(date, locale, "dd/MM/yyyy HH:mm");
}

export function formatRelative(
  date: Date | string | null | undefined,
  locale = "ar"
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: toLocale(locale) });
}

export function formatCurrency(
  amount: number | null | undefined,
  locale = "ar"
): string {
  if (amount == null) return "";
  const formatter = new Intl.NumberFormat(
    locale === "ar" ? "ar-EG" : "en-EG",
    {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
  return formatter.format(amount);
}

export function formatNumber(n: number, locale = "ar"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG").format(n);
}
