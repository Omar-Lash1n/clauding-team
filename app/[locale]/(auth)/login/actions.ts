"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_PATHS } from "@/lib/constants";
import type { UserRole } from "@/types/domain";

export async function selectRoleAction(role: UserRole, locale: string): Promise<never> {
  const cookieStore = await cookies();
  cookieStore.set("demo_role", role, {
    httpOnly: true,
    maxAge: 86400 * 7, // 7 days
    path: "/",
    sameSite: "lax",
  });
  redirect(`/${locale}${ROLE_PATHS[role]}`);
}
