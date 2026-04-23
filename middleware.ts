import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware";
import type { UserRole } from "@/types/domain";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = ["/(auth)", "/login", "/signup", "/demo"];

function isPublicPath(pathname: string, locale: string): boolean {
  const stripped = pathname.replace(`/${locale}`, "") || "/";
  if (stripped === "/") return true;
  for (const p of PUBLIC_PATHS) {
    if (stripped === p || stripped.startsWith(p + "/")) return true;
  }
  return false;
}

function getRolePrefix(role: UserRole): string {
  switch (role) {
    case "governor":
      return "/governor";
    case "district_manager":
      return "/manager";
    case "technician":
      return "/technician";
    case "citizen":
      return "/citizen";
  }
}

export async function middleware(request: NextRequest) {
  // Step 1: next-intl locale detection
  const intlResponse = intlMiddleware(request);
  const response = intlResponse ?? NextResponse.next();

  // Step 2: Supabase session refresh (non-blocking)
  const supabase = createMiddlewareSupabase(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Detect locale from path
  const localeMatch = pathname.match(/^\/(ar|en)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : "ar";
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  // Step 3: Route guards
  if (isPublicPath(pathname, locale)) {
    // If authenticated user hits /login or /signup, redirect to dashboard
    if (
      user &&
      (pathWithoutLocale === "/login" || pathWithoutLocale === "/signup")
    ) {
      const roleKey = request.cookies.get("urbanfix_role")?.value as UserRole | undefined;
      if (roleKey) {
        const dashboardPath = `/${locale}${getRolePrefix(roleKey)}`;
        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }
      // Fetch from DB
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) {
        const redirectResponse = NextResponse.redirect(
          new URL(`/${locale}${getRolePrefix(profile.role)}`, request.url)
        );
        redirectResponse.cookies.set("urbanfix_role", profile.role, {
          httpOnly: true,
          maxAge: 86400,
          path: "/",
          sameSite: "lax",
        });
        return redirectResponse;
      }
    }
    return response;
  }

  // Protected route: require auth
  if (!user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access enforcement
  const cachedRole = request.cookies.get("urbanfix_role")?.value as UserRole | undefined;
  let role = cachedRole;

  if (!role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role;
  }

  if (role) {
    const allowed = getRolePrefix(role);
    const protectedPrefixes = ["/citizen", "/manager", "/technician", "/governor"];
    const hitProtected = protectedPrefixes.find((p) =>
      pathWithoutLocale.startsWith(p)
    );

    if (hitProtected && !pathWithoutLocale.startsWith(allowed)) {
      // Redirect to correct dashboard
      const correctResponse = NextResponse.redirect(
        new URL(`/${locale}${allowed}`, request.url)
      );
      return correctResponse;
    }

    if (!cachedRole) {
      response.cookies.set("urbanfix_role", role, {
        httpOnly: true,
        maxAge: 86400,
        path: "/",
        sameSite: "lax",
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
