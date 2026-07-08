import type { createClient } from "@/lib/supabase/server";

/**
 * Role-based post-auth routing, shared by the auth server actions and the
 * email-confirmation callback route. Deliberately free of runtime imports
 * (only a type import) so it is safe to pull into the edge middleware too.
 */

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Minimal shape of the authenticated user we need for post-auth routing. */
type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: { role?: string | null } | null;
};

/** The single screen a given role is allowed to land on after auth. */
export function roleHome(role: string | null | undefined): string {
  return role === "parent" ? "/parent" : "/map";
}

const USERNAME_PATTERN = /[^a-zA-Z0-9_ ]/g;

/** Derives a valid (2-20 char) username from an email's local part. */
function deriveUsername(email: string | null | undefined): string {
  const local = (email ?? "").split("@")[0] ?? "";
  const cleaned = local.replace(USERNAME_PATTERN, "").slice(0, 20);
  return cleaned.length >= 2 ? cleaned : "parent";
}

/**
 * Ensures a signed-in parent has a `profiles` row (and a stats row for parity),
 * so they skip the child-focused onboarding flow. The `profiles_insert_own`
 * RLS policy permits setting `role` on insert; the escalation guard only blocks
 * role *changes*. Returns true once a parent profile exists. Best-effort — a
 * failure just leaves the caller to fall back to the default landing page.
 */
export async function ensureParentProfile(
  supabase: SupabaseServerClient,
  user: AuthUser
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return true;

  const base = deriveUsername(user.email);
  for (let attempt = 0; attempt < 3; attempt++) {
    const username = attempt === 0 ? base : `${base}_${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase
      .from("profiles")
      .insert({ id: user.id, username, role: "parent" });

    if (!error) {
      // Parents have no gameplay stats yet, but a zeroed row keeps the parent
      // dashboard's stats query symmetrical with the child flow.
      await supabase.from("user_stats").insert({ profile_id: user.id });
      return true;
    }
    // 23505 = unique_violation, i.e. the derived username is taken — retry.
    if (error.code !== "23505") return false;
  }
  return false;
}

/**
 * Where a freshly-authenticated user should land. Parents go to the parent
 * dashboard (provisioning their profile on first sight if their signup metadata
 * marks them as a parent); everyone else goes to the map, where middleware
 * sends profile-less children on to onboarding.
 */
export async function resolveHomePath(supabase: SupabaseServerClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/auth/login";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return roleHome(profile.role);
  }

  // No profile yet — provision one for parents flagged at signup.
  if (user.user_metadata?.role === "parent") {
    const ok = await ensureParentProfile(supabase, user);
    if (ok) return "/parent";
  }
  return "/map";
}
