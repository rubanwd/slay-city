import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { resolveHomePath } from "@/features/auth/roleRouting";

/**
 * Handles the redirect from Supabase for email confirmation, magic links, and
 * OAuth. Exchanges the `code` query param for a session cookie, then forwards
 * the user on. An explicit `next` (e.g. the password-reset flow) is honored;
 * otherwise the destination is resolved by role — parents land on the parent
 * dashboard (and are provisioned on first confirmation), everyone else on the
 * map.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = next ?? (await resolveHomePath(supabase));
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent("Could not sign in. Please try again.")}`
  );
}
