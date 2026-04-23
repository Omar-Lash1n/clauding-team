"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput, otpSchema, type OtpInput } from "@/lib/validators/schemas";
import { extractFromNID } from "@/lib/validators/nid";
import { createProfileAction } from "./actions";

export default function SignupPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [nidData, setNidData] = useState<{
    birthDate: string;
    gender: string;
  } | null>(null);

  const step1Form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const step2Form = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
  });

  // Watch NID for live extraction
  const watchedNid = step1Form.watch("national_id");
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

  async function onStep1Submit(data: SignupInput) {
    setLoading(true);
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/citizen`,
        data: {
          full_name: data.full_name,
          national_id: data.national_id,
          phone: data.phone,
        },
      },
    });

    if (error) {
      setServerError(t("errors.signupFailed") + " " + error.message);
      setLoading(false);
      return;
    }

    setPendingEmail(data.email);
    setStep(2);
    setLoading(false);
  }

  async function onStep2Submit(data: OtpInput) {
    setLoading(true);
    setServerError(null);
    const supabase = createClient();

    const { error, data: verifyData } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: data.token,
      type: "signup",
    });

    if (error || !verifyData.user) {
      setServerError(t("errors.otpInvalid"));
      setLoading(false);
      return;
    }

    // Create profile row via server action
    const step1Values = step1Form.getValues();
    const extracted = extractFromNID(step1Values.national_id);

    const result = await createProfileAction({
      full_name: step1Values.full_name,
      national_id: step1Values.national_id,
      phone: step1Values.phone,
      email: step1Values.email,
      birth_date: extracted?.birthDate.toISOString().split("T")[0] ?? null,
      gender: extracted?.gender ?? null,
    });

    if (!result.success) {
      setServerError(t("errors.profileCreateFailed"));
      setLoading(false);
      return;
    }

    router.push(`/${locale}/citizen`);
    router.refresh();
  }

  if (step === 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F7FF] px-4 py-8">
        <div className="absolute top-4 end-4">
          <LanguageToggle />
        </div>

        <Link href={`/${locale}`} className="mb-8 text-2xl font-bold text-[#3E7D60] font-rubik">
          {tc("appName")}
        </Link>

        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-8 w-8 text-[#3E7D60]" />
            </div>
            <CardTitle className="text-xl text-center">{t("otpTitle")}</CardTitle>
            <CardDescription className="text-center">
              {t("otpSubtitle")}
            </CardDescription>
            <p className="text-center text-sm text-[#3E7D60] font-medium" dir="ltr">
              {pendingEmail}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1C2D5B]">{t("otpCode")}</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="12345678"
                  dir="ltr"
                  className="text-center text-2xl tracking-widest h-14"
                  {...step2Form.register("token")}
                />
                {step2Form.formState.errors.token && (
                  <p className="text-xs text-[#C94C4C]">
                    {step2Form.formState.errors.token.message}
                  </p>
                )}
              </div>

              {serverError && (
                <div className="rounded-lg bg-[#C94C4C]/10 border border-[#C94C4C]/20 px-4 py-3">
                  <p className="text-sm text-[#C94C4C]">{serverError}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? tc("loading") : t("verifyOtp")}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-[#3E7D60]"
                onClick={() => setStep(1)}
              >
                {tc("back")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
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
          <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C2D5B]">{t("fullName")}<span className="text-[#C94C4C] ms-0.5">*</span></label>
              <Input placeholder={t("fullName")} {...step1Form.register("full_name")} />
              {step1Form.formState.errors.full_name && (
                <p className="text-xs text-[#C94C4C]">{step1Form.formState.errors.full_name.message}</p>
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
                {...step1Form.register("national_id")}
              />
              {step1Form.formState.errors.national_id && (
                <p className="text-xs text-[#C94C4C]">{step1Form.formState.errors.national_id.message}</p>
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
                {...step1Form.register("phone")}
              />
              {step1Form.formState.errors.phone && (
                <p className="text-xs text-[#C94C4C]">{step1Form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C2D5B]">{t("email")}<span className="text-[#C94C4C] ms-0.5">*</span></label>
              <Input
                type="email"
                placeholder="you@example.com"
                dir="ltr"
                {...step1Form.register("email")}
              />
              {step1Form.formState.errors.email && (
                <p className="text-xs text-[#C94C4C]">{step1Form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C2D5B]">{t("password")}<span className="text-[#C94C4C] ms-0.5">*</span></label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  dir="ltr"
                  className="pe-10"
                  {...step1Form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-[#1C2D5B]/40"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {step1Form.formState.errors.password && (
                <p className="text-xs text-[#C94C4C]">{step1Form.formState.errors.password.message}</p>
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
