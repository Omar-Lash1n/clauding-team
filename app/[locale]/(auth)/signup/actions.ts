"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { DEMO_PASSWORD } from "@/lib/constants";

interface CreateProfileInput {
  full_name: string;
  national_id: string;
  phone: string;
  email: string;
  birth_date: string | null;
  gender: string | null;
}

/**
 * Creates a new citizen user with auto-confirmed email and the standard password.
 * Uses admin client to create user (bypassing OTP).
 * Then signs them in immediately.
 */
export async function signupCitizenAction(
  input: CreateProfileInput,
  locale: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminSupabase();

  // 1. Check if email already exists
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", input.email.toLowerCase().trim())
    .single();

  if (existing) {
    return { success: false, error: "email_already_registered" };
  }

  // 2. Create user via admin (auto-confirms email)
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email: input.email.toLowerCase().trim(),
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
    },
  });

  if (createError || !newUser.user) {
    return { success: false, error: createError?.message || "Failed to create user" };
  }

  // 3. Create profile row
  const { error: profileError } = await admin.from("profiles").upsert({
    id: newUser.user.id,
    role: "citizen" as const,
    full_name: input.full_name,
    email: input.email.toLowerCase().trim(),
    phone: input.phone,
    national_id: input.national_id,
    birth_date: input.birth_date,
    gender: (input.gender as "male" | "female") ?? null,
  });

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // 4. Sign the user in immediately
  const supabase = await createServerSupabase();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: input.email.toLowerCase().trim(),
    password: DEMO_PASSWORD,
  });

  if (signInError) {
    return { success: false, error: signInError.message };
  }

  // 5. Redirect to citizen dashboard
  redirect(`/${locale}/citizen`);
}
