import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { resolveHomePath } from "@/features/auth/roleRouting";

/** Bounce back to the login page with a message the user can act on. */
function toLogin(origin: string, error: string) {
  return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error)}`);
}

/**
 * Only same-site absolute paths may be followed, so a crafted link can't turn
 * the callback into an open redirect.
 */
function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

/**
 * Handles the redirect from Supabase for email confirmation, password
 * recovery, magic links, and OAuth. Two link shapes arrive here depending on
 * the email template the project uses: the PKCE flow sends `?code=`, the
 * default templates send `?token_hash=&type=`. Both are exchanged for a
 * session cookie, then the user is forwarded on. An explicit `next` (e.g. the
 * password-reset flow) is honored; otherwise the destination is resolved by
 * role — parents land on the parent dashboard (and are provisioned on first
 * confirmation), everyone else on the map.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));

  // Supabase appends these when it rejects the link itself — most often an
  // expired or already-used recovery link. Surface the reason rather than the
  // generic failure, otherwise a dead reset link looks like a broken app.
  const linkError = searchParams.get("error_description") ?? searchParams.get("error");
  if (linkError) {
    return toLogin(origin, linkError);
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (code || (tokenHash && type)) {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash! });

    if (!error) {
      // A recovery link must always land on the reset form, even when the
      // email template dropped our `next` param.
      const destination =
        next ?? (type === "recovery" ? "/auth/reset-password" : await resolveHomePath(supabase));
      return NextResponse.redirect(`${origin}${destination}`);
    }

    return toLogin(origin, error.message);
  }

  return toLogin(origin, "Could not sign in. Please try again.");
}
