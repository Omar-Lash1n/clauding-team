"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_CREDENTIALS, DEMO_PASSWORD, ROLE_PATHS } from "@/lib/constants";
import type { UserRole } from "@/types/domain";

export async function signInDemoAction(
  role: UserRole,
  locale: string
): Promise<never> {
  const supabase = await createServerSupabase();
  const credentials = DEMO_CREDENTIALS[role];

  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: DEMO_PASSWORD,
  });

  if (error) {
    redirect(`/${locale}/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}${ROLE_PATHS[role]}`);
}
