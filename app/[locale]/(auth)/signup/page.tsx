"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { signupCitizenAction } from "./actions";
import { extractFromNID } from "@/lib/validators/nid";
import { z } from "zod";

// Egyptian phone number
const egyptianPhone = z
  .string()
  .regex(/^\+201[0-9]{9}$/, "Phone must be in format +201XXXXXXXXX");

const signupFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  national_id: z.string().length(14, "National ID must be 14 digits"),
  phone: egyptianPhone,
  email: z.string().email("Invalid email address"),
});
type SignupFormInput = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nidData, setNidData] = useState<{
    birthDate: string;
    gender: string;
  } | null>(null);

  const form = useForm<SignupFormInput>({
    resolver: zodResolver(signupFormSchema),
  });

  // Watch NID for live extraction
  const watchedNid = form.watch("national_id");
  if (watchedNid?.length === 14) {
    const extracted = extractFromNID(watchedNid);
    if (extracted && !nidData) {
      setNidData({
        birthDate: extracted.birthDate.toLocaleDateString(
          locale === "ar" ? "ar-EG" : "en-EG"
        ),
        gender: extracted.gender,
      });
    }
  } else if (nidData) {
    setNidData(null);
  }

  async function onSubmit(data: SignupFormInput) {
    setLoading(true);
    setServerError(null);

    const extracted = extractFromNID(data.national_id);

    const result = await signupCitizenAction(
      {
        full_name: data.full_name,
        national_id: data.national_id,
        phone: data.phone,
        email: data.email,
        birth_date: extracted?.birthDate.toISOString().split("T")[0] ?? null,
        gender: extracted?.gender ?? null,
      },
      locale
    );

    // If the action redirected, we won't reach here.
    if (result && !result.success) {
      if (result.error === "email_already_registered") {
        setServerError(t("errors.signupFailed") + " Email is already registered.");
      } else {
        setServerError(t("errors.signupFailed") + " " + (result.error || ""));
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F7FF] px-4 py-8">
      <div className="absolute top-4 end-4">
        <LanguageToggle />
      </div>

      <Link href={`/${locale}`} className="mb-8 text-2xl font-bold text-[#3E7D60] font-rubik">
        {tc("appName")}
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">{t("signupTitle")}</CardTitle>
          <CardDescription>{t("signupSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C2D5B]">{t("fullName")}<span className="text-[#C94C4C] ms-0.5">*</span></label>
              <Input placeholder={t("fullName")} {...form.register("full_name")} />
              {form.formState.errors.full_name && (
                <p className="text-xs text-[#C94C4C]">{form.formState.errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C2D5B]">{t("nationalId")}<span className="text-[#C94C4C] ms-0.5">*</span></label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={14}
                placeholder="30001010188011"
                dir="ltr"
                {...form.register("national_id")}
              />
              {form.formState.errors.national_id && (
                <p className="text-xs text-[#C94C4C]">{form.formState.errors.national_id.message}</p>
              )}
              {nidData && (
                <div className="rounded-lg bg-[#3E7D60]/10 px-3 py-2 text-xs text-[#3E7D60]">
                  <span className="font-medium">{t("nationalIdAutoFill")}: </span>
                  {t("birthDate")}: {nidData.birthDate} · {t("gender")}: {t(nidData.gender as "male" | "female")}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C2D5B]">{t("phone")}<span className="text-[#C94C4C] ms-0.5">*</span></label>
              <Input
                type="tel"
                placeholder="+201000000000"
                dir="ltr"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-[#C94C4C]">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C2D5B]">{t("email")}<span className="text-[#C94C4C] ms-0.5">*</span></label>
              <Input
                type="email"
                placeholder="you@example.com"
                dir="ltr"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-[#C94C4C]">{form.formState.errors.email.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg bg-[#C94C4C]/10 border border-[#C94C4C]/20 px-4 py-3">
                <p className="text-sm text-[#C94C4C]">{serverError}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? tc("loading") : t("signupCta")}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#1C2D5B]/60">
            {t("hasAccount")}{" "}
            <Link href={`/${locale}/login`} className="text-[#3E7D60] font-medium hover:underline">
              {tc("login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
