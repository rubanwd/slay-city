import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";
import { roleHome } from "@/features/auth/roleRouting";
import { VIEW_AS_TEACHER_COOKIE } from "@/features/teacher/viewAsCookie";

/**
 * Routes reachable without a session. Everything else requires auth.
 *
 * `/demo` is the signed-out landing experience — a playable slice of the map
 * (see `src/features/demo/`). It is public by design; the pages themselves send
 * a signed-in visitor on to their own home.
 */
function isPublicPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/demo");
}

export async function middleware(request: NextRequest) {
  // Start with a pass-through response we can attach refreshed cookies to.
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() refreshes the session and validates the JWT with the
  // Supabase Auth server. Do not run any logic between creating the client and
  // this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated users may only reach public routes.
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Authenticated users shouldn't see the login/register pages — send them to
  // their own home: admins to the console, parents to their dashboard, students
  // to the map. The callback route is exempt so the code exchange can complete,
  // and reset-password is exempt because the recovery link signs the user in
  // (via a temporary session) specifically so they can set a new password.
  if (
    user &&
    pathname.startsWith("/auth") &&
    !pathname.startsWith("/auth/callback") &&
    !pathname.startsWith("/auth/reset-password")
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const url = request.nextUrl.clone();
    url.pathname = profile ? roleHome(profile.role) : "/onboarding";
    return NextResponse.redirect(url);
  }

  // Authenticated users without a profile row yet must finish onboarding
  // first; users who already have one shouldn't be sent back through it.
  // We also enforce role-based area access here so it can't be bypassed by
  // navigating directly: parents live only in the parent dashboard area, and
  // students can never reach it.
  if (user && !isPublicPath(pathname)) {
    const onOnboarding = pathname.startsWith("/onboarding");
    const inParentArea = pathname === "/parent" || pathname.startsWith("/parent/");
    const inAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
    const inTeacherArea = pathname === "/teacher" || pathname.startsWith("/teacher/");
    const onMap = pathname === "/map";
    // An admin who is "viewing as" a teacher (cookie set) is allowed into the
    // teacher console; the server guard verifies the cookie points at a real
    // teacher before rendering anything.
    const viewingAsTeacher = Boolean(request.cookies.get(VIEW_AS_TEACHER_COOKIE)?.value);
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile && !onOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (profile && onOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = roleHome(profile.role);
      return NextResponse.redirect(url);
    }

    if (profile) {
      // The admin console is admin-only. Everyone else is sent to their home.
      if (inAdminArea && profile.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = roleHome(profile.role);
        return NextResponse.redirect(url);
      }
      // Admins may only use the admin console — they don't play the game, so
      // keep them out of missions, wardrobe, etc. The map itself is the one
      // exception: it is the only place a district background can be seen in
      // position, so admins need it to check their own content. Without it the
      // only way to look was to demote yourself to a player, which silently
      // breaks every admin write.
      if (profile.role === "admin" && !inAdminArea && !onMap && !(inTeacherArea && viewingAsTeacher)) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
      // Parents may only use the parent dashboard — bounce them out of the
      // student game screens (map, missions, wardrobe, profile, …).
      if (profile.role === "parent" && !inParentArea) {
        const url = request.nextUrl.clone();
        url.pathname = "/parent";
        return NextResponse.redirect(url);
      }
      // Teachers may only use their own dashboard, same rule as parents.
      if (profile.role === "teacher" && !inTeacherArea) {
        const url = request.nextUrl.clone();
        url.pathname = "/teacher";
        return NextResponse.redirect(url);
      }
      // Students (and any non-parent/teacher, non-admin role) can't view the
      // parent or teacher dashboards. Admins are intentionally unrestricted.
      if (profile.role === "student" && (inParentArea || inTeacherArea)) {
        const url = request.nextUrl.clone();
        url.pathname = "/map";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (build assets)
     * - favicon.ico, manifest, the service worker, icons, and image files
     *
     * sw.js is excluded so the browser fetches the script directly instead of
     * being redirected to /auth/login — service workers cannot register from a
     * redirected script response.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
