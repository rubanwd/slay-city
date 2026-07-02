import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes reachable without a session. Everything else requires auth. */
function isPublicPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/auth");
}

export async function middleware(request: NextRequest) {
  // Start with a pass-through response we can attach refreshed cookies to.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
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

  // Authenticated users shouldn't see the login/register pages — send them in.
  // The callback route is exempt so the code exchange can complete, and
  // reset-password is exempt because the recovery link signs the user in
  // (via a temporary session) specifically so they can set a new password.
  if (
    user &&
    pathname.startsWith("/auth") &&
    !pathname.startsWith("/auth/callback") &&
    !pathname.startsWith("/auth/reset-password")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/map";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (build assets)
     * - favicon.ico, manifest, icons, and image files
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
