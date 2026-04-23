import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// Demo user IDs from the seeded data
const DEMO_USER_IDS: Record<string, string> = {
  governor: "a0000000-0000-0000-0000-000000000001",
  district_manager: "b0000000-0000-0000-0000-000000000001",
  technician: "c0000000-0000-0000-0000-000000000001",
  citizen: "d0000000-0000-0000-0000-000000000001",
};

/**
 * Creates a Supabase client that:
 * 1. Uses the service-role key (bypasses RLS)
 * 2. Patches auth.getUser() to return the demo user from cookies
 *
 * This allows ALL existing code to work without real Supabase auth.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("demo_role")?.value;
  const demoUserId = demoRole
    ? DEMO_USER_IDS[demoRole] || DEMO_USER_IDS.citizen
    : DEMO_USER_IDS.citizen;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Monkey-patch auth.getUser to return the demo user
  const originalGetUser = client.auth.getUser.bind(client.auth);
  client.auth.getUser = async () => {
    return {
      data: {
        user: {
          id: demoUserId,
          email: `demo-${demoRole || "citizen"}@urbanfix.local`,
          aud: "authenticated",
          role: "authenticated",
          app_metadata: { provider: "email", providers: ["email"] },
          user_metadata: {},
          created_at: new Date().toISOString(),
        } as any,
      },
      error: null,
    };
  };

  return client;
}
