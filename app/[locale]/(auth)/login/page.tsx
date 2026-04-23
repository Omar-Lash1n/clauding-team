"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { createClient } from "@/lib/supabase/client";
import { otpSchema, type OtpInput } from "@/lib/validators/schemas";
import { ROLE_PATHS } from "@/lib/constants";
import type { UserRole } from "@/types/domain";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});
type EmailInput = z.infer<typeof emailSchema>;

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>("");

  const step1Form = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
  });

  const step2Form = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
  });

  async function onStep1Submit(data: EmailInput) {
    setLoading(true);
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        shouldCreateUser: false, // Don't auto-signup users on the login page
      },
    });

    if (error) {
      setServerError(t("errors.generic") + " " + error.message);
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

    const { error, data: authData } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: data.token,
      type: "email", // Use 'email' for magic link / OTP login
    });

    if (error || !authData.user) {
      setServerError(t("errors.otpInvalid") || "Invalid code provided.");
      setLoading(false);
      return;
    }

    // Fetch user role for redirection
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single<{ role: UserRole }>();

    const role: UserRole = profile?.role ?? "citizen";
    router.push(`/${locale}${ROLE_PATHS[role]}`);
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
            <CardTitle className="text-xl text-center">Enter Login Code</CardTitle>
            <CardDescription className="text-center">
              We sent a 6-digit code to your email.
            </CardDescription>
            <p className="text-center text-sm text-[#3E7D60] font-medium" dir="ltr">
              {pendingEmail}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1C2D5B]">{t("otpCode") || "Code"}</label>
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
                {loading ? tc("loading") : "Verify & Login"}
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

      <Card className="w-full max-w-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">{t("loginTitle")}</CardTitle>
          <CardDescription>Login via Email Code</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C2D5B]">{t("email")}</label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...step1Form.register("email")}
                dir="ltr"
              />
              {step1Form.formState.errors.email && (
                <p className="text-xs text-[#C94C4C]">{step1Form.formState.errors.email.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg bg-[#C94C4C]/10 border border-[#C94C4C]/20 px-4 py-3">
                <p className="text-sm text-[#C94C4C]">{serverError}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? tc("loading") : "Send Login Code"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#1C2D5B]/60">
            {t("noAccount")}{" "}
            <Link href={`/${locale}/signup`} className="text-[#3E7D60] font-medium hover:underline">
              {tc("signup")}
            </Link>
          </div>

          <div className="mt-3 text-center">
            <Link
              href={`/${locale}/demo`}
              className="text-xs text-[#1C2D5B]/40 hover:text-[#3E7D60]"
            >
              {t("demoMode")} →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
