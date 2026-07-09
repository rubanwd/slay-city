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
  /** User-writable — only trusted for the low-stakes parent flag. */
  user_metadata?: Record<string, unknown> | null;
  /** Service-role-set only — trusted for the admin grant. */
  app_metadata?: Record<string, unknown> | null;
};

/** A role we may auto-provision a profile for (never `child` — that's onboarding). */
type ProvisionRole = "parent" | "admin";

/** The screen a given role lands on after auth. */
export function roleHome(role: string | null | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "parent") return "/parent";
  return "/map";
}

const USERNAME_PATTERN = /[^a-zA-Z0-9_ ]/g;

/** Derives a valid (2-20 char) username from an email's local part. */
function deriveUsername(email: string | null | undefined, fallback: string): string {
  const local = (email ?? "").split("@")[0] ?? "";
  const cleaned = local.replace(USERNAME_PATTERN, "").slice(0, 20);
  return cleaned.length >= 2 ? cleaned : fallback;
}

/**
 * Ensures a signed-in non-child user has a `profiles` row, so they skip the
 * child-focused onboarding flow. The `profiles_insert_own` RLS policy permits
 * setting `role` on insert; the escalation guard only blocks role *changes*.
 * Returns true once the profile exists. Best-effort — a failure just leaves the
 * caller to fall back to the default landing page.
 *
 * SECURITY: only call this for a role the caller has actually been granted —
 * `parent` from `user_metadata` (self-selected at signup, low stakes) or
 * `admin` from `app_metadata` (service-role-set, i.e. not user-forgeable).
 */
export async function ensureRoleProfile(
  supabase: SupabaseServerClient,
  user: AuthUser,
  role: ProvisionRole
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return true;

  const base = deriveUsername(user.email, role);
  for (let attempt = 0; attempt < 3; attempt++) {
    const username = attempt === 0 ? base : `${base}_${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("profiles").insert({ id: user.id, username, role });

    if (!error) {
      if (role === "parent") {
        // Parents have no gameplay stats yet, but a zeroed row keeps the parent
        // dashboard's stats query symmetrical with the child flow.
        await supabase.from("user_stats").insert({ profile_id: user.id });
      }
      return true;
    }
    // 23505 = unique_violation, i.e. the derived username is taken — retry.
    if (error.code !== "23505") return false;
  }
  return false;
}

/**
 * Where a freshly-authenticated user should land. A user with a profile goes to
 * their role's home (admins to the admin console, parents to their dashboard,
 * children to the map). A profile-less user is provisioned if they carry a
 * trusted role flag — admins skip onboarding straight to `/admin`, parents to
 * `/parent`; everyone else goes to the map, where middleware routes children
 * on to onboarding.
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

  // No profile yet — provision one for a trusted role flag so the user skips the
  // child onboarding. Admin comes from app_metadata (service-role-set only);
  // parent from user_metadata (self-selected at signup).
  if (user.app_metadata?.role === "admin") {
    if (await ensureRoleProfile(supabase, user, "admin")) return "/admin";
  }
  if (user.user_metadata?.role === "parent") {
    if (await ensureRoleProfile(supabase, user, "parent")) return "/parent";
  }
  return "/map";
}
