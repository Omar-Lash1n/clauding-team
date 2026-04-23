"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validators/schemas";
import { ROLE_PATHS } from "@/lib/constants";
import type { UserRole } from "@/types/domain";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    setServerError(null);
    const supabase = createClient();

    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setServerError(t("errors.emailNotVerified"));
      } else {
        setServerError(t("errors.invalidCredentials"));
      }
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single<{ role: UserRole }>();

      const role: UserRole = profile?.role ?? "citizen";
      router.push(`/${locale}${ROLE_PATHS[role]}`);
      router.refresh();
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

      <Card className="w-full max-w-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C2D5B]">{t("email")}</label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
                dir="ltr"
              />
              {errors.email && (
                <p className="text-xs text-[#C94C4C]">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C2D5B]">{t("password")}</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  dir="ltr"
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-[#1C2D5B]/40 hover:text-[#1C2D5B]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#C94C4C]">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg bg-[#C94C4C]/10 border border-[#C94C4C]/20 px-4 py-3">
                <p className="text-sm text-[#C94C4C]">{serverError}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? tc("loading") : t("loginCta")}
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
