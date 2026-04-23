"use server";

import { createServerSupabase } from "@/lib/supabase/server";

interface CreateProfileInput {
  full_name: string;
  national_id: string;
  phone: string;
  email: string;
  birth_date: string | null;
  gender: string | null;
}

export async function createProfileAction(
  input: CreateProfileInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    role: "citizen" as const,
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    national_id: input.national_id,
    birth_date: input.birth_date,
    gender: (input.gender as "male" | "female") ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
