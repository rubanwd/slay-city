import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Handles the redirect from Supabase for email confirmation, magic links, and
 * OAuth. Exchanges the `code` query param for a session cookie, then forwards
 * the user on to `next` (defaults to `/map`).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/map";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent("Could not sign in. Please try again.")}`
  );
}
