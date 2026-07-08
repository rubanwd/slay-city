"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/** Result returned to a form on failure (or on a success that doesn't redirect). */
export type AuthState = {
  /** Present when the action failed — shown to the user. */
  error?: string;
  /** Present on a non-redirecting success, e.g. "confirm your email". */
  message?: string;
};

/** Roles a user may self-select at registration. Admin is never self-assigned. */
export type SignupRole = "child" | "parent";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Minimal shape of the authenticated user we need for post-auth routing. */
type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: { role?: string | null } | null;
};

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
async function ensureParentProfile(
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
async function resolveHomePath(supabase: SupabaseServerClient): Promise<string> {
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
    return profile.role === "parent" ? "/parent" : "/map";
  }

  // No profile yet — provision one for parents flagged at signup.
  if (user.user_metadata?.role === "parent") {
    const ok = await ensureParentProfile(supabase, user);
    if (ok) return "/parent";
  }
  return "/map";
}

/**
 * Register a new account. `role` is chosen at signup; parents additionally
 * supply the (future-linked) child's email, stashed in user metadata. On
 * success with an active session the user is routed by role — parents to the
 * parent dashboard, children to the map. If the project requires email
 * confirmation, a message is returned instead (there is no session yet).
 */
export async function signUp(
  email: string,
  password: string,
  role: SignupRole = "child",
  childEmail?: string
): Promise<AuthState> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
      data: {
        role,
        ...(role === "parent" && childEmail ? { child_email: childEmail } : {}),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    if (role === "parent" && data.user) {
      await ensureParentProfile(supabase, data.user);
    }
    revalidatePath("/", "layout");
    redirect(role === "parent" ? "/parent" : "/map");
  }

  return {
    message: "Account created! Check your email to confirm, then log in.",
  };
}

/** Log in with email + password. Routes by role on success (parents to the
 * parent dashboard, everyone else to the map). */
export async function signIn(email: string, password: string): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const destination = await resolveHomePath(supabase);
  revalidatePath("/", "layout");
  redirect(destination);
}

/** Clear the session and return to the login page. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

/* ── Form-bound actions (useActionState signature) ─────────────────────────── */

export async function loginFormAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  return signIn(email, password);
}

/** Loose email shape check — the real validation is done by Supabase Auth. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerFormAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const role: SignupRole = formData.get("role") === "parent" ? "parent" : "child";
  const childEmail = String(formData.get("childEmail") ?? "").trim();

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (role === "parent") {
    if (!childEmail) {
      return { error: "Enter your child's email to link their account." };
    }
    if (!EMAIL_PATTERN.test(childEmail)) {
      return { error: "Enter a valid child email address." };
    }
    if (childEmail.toLowerCase() === email.toLowerCase()) {
      return { error: "The child email must be different from your own." };
    }
  }

  return signUp(email, password, role, role === "parent" ? childEmail : undefined);
}

/**
 * Send a password-reset email. The link routes through `/auth/callback`,
 * which exchanges the code for a (recovery) session and forwards on to
 * `/auth/reset-password`.
 */
export async function requestPasswordReset(email: string): Promise<AuthState> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin}/auth/callback?next=/auth/reset-password` : undefined,
  });

  if (error) {
    return { error: error.message };
  }

  // Same message whether or not the email is registered, so this can't be
  // used to enumerate accounts.
  return { message: "If an account exists for that email, a reset link has been sent." };
}

export async function forgotPasswordFormAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Enter your email." };
  }

  return requestPasswordReset(email);
}

/**
 * Set a new password for the signed-in user. Only valid within the recovery
 * session created by clicking a reset-password email link. Signs the user out
 * afterward so they log back in with the new password.
 */
export async function updatePassword(password: string): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login?message=" + encodeURIComponent("Password updated. Log in with your new password."));
}

export async function resetPasswordFormAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password) {
    return { error: "Enter a new password." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  return updatePassword(password);
}
