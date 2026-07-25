"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { VIEW_AS_TEACHER_COOKIE } from "@/features/teacher/viewAsCookie";

import { resolveHomePath } from "./roleRouting";

/** Result returned to a form on failure (or on a success that doesn't redirect). */
export type AuthState = {
  /** Present when the action failed — shown to the user. */
  error?: string;
  /** Present on a non-redirecting success, e.g. "confirm your email". */
  message?: string;
};

/** Roles a user may self-select at registration. Admin is never self-assigned. */
export type SignupRole = "student" | "parent";

/**
 * Base URL used to build the email-confirmation redirect. Prefer an explicit
 * `NEXT_PUBLIC_SITE_URL` (set this on the deployment) so confirmation links
 * always point at the real site; fall back to the request origin locally.
 * Note: the target must also be in the Supabase project's redirect allow-list,
 * otherwise Supabase falls back to the project's Site URL.
 */
async function resolveSiteUrl(): Promise<string | undefined> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return (await headers()).get("origin") ?? undefined;
}

/**
 * Register a new account. `role` is chosen at signup; parents additionally
 * supply the (future-linked) student's email, stashed in user metadata. On
 * success with an active session the user is routed by role — parents to the
 * parent dashboard, students to the map. If the project requires email
 * confirmation, a message is returned instead (there is no session yet).
 */
export async function signUp(
  email: string,
  password: string,
  role: SignupRole = "student",
  studentEmail?: string
): Promise<AuthState> {
  const supabase = await createClient();
  const siteUrl = await resolveSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: siteUrl ? `${siteUrl}/auth/callback` : undefined,
      data: {
        role,
        ...(role === "parent" && studentEmail ? { student_email: studentEmail } : {}),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    // Route by role: allow-listed admins land on /admin (no onboarding), parents
    // are provisioned to /parent, everyone else goes to /map → onboarding.
    const destination = await resolveHomePath(supabase);
    revalidatePath("/", "layout");
    redirect(destination);
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

/**
 * Start the Google OAuth flow. Supabase returns the provider's consent URL,
 * which we redirect the browser to; Google then sends the user back to
 * `/auth/callback`, where the code is exchanged for a session and the user is
 * routed by role. Google users carry no role flag, so they land on `/map` and
 * middleware forwards first-timers into onboarding — the same as a student signup.
 *
 * Requires the Google provider to be enabled in the Supabase project, and
 * `${siteUrl}/auth/callback` to be in its redirect allow-list.
 */
export async function signInWithGoogle(): Promise<AuthState> {
  const supabase = await createClient();
  const siteUrl = await resolveSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: siteUrl ? `${siteUrl}/auth/callback` : undefined,
    },
  });

  if (error || !data.url) {
    return { error: error?.message ?? "Could not start Google sign-in." };
  }

  redirect(data.url);
}

/** Form-bound wrapper so a submit button can kick off the Google flow. */
export async function googleFormAction(): Promise<void> {
  await signInWithGoogle();
}

/** Clear the session and return to the login page. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Drop any admin "View as Teacher" impersonation so it can't leak into the
  // next session on this browser.
  (await cookies()).delete(VIEW_AS_TEACHER_COOKIE);
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
  const role: SignupRole = formData.get("role") === "parent" ? "parent" : "student";
  const studentEmail = String(formData.get("studentEmail") ?? "").trim();

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
    if (!studentEmail) {
      return { error: "Enter your student's email to link their account." };
    }
    if (!EMAIL_PATTERN.test(studentEmail)) {
      return { error: "Enter a valid student email address." };
    }
    if (studentEmail.toLowerCase() === email.toLowerCase()) {
      return { error: "The student email must be different from your own." };
    }
  }

  return signUp(email, password, role, role === "parent" ? studentEmail : undefined);
}

/**
 * Send a password-reset email. The link routes through `/auth/callback`,
 * which exchanges the code for a (recovery) session and forwards on to
 * `/auth/reset-password`.
 *
 * Uses the same `resolveSiteUrl()` as signup/OAuth: on a deployment the
 * request `origin` is not always the public site (proxies, custom domains,
 * previews), and an origin Supabase doesn't recognise is dropped in favour of
 * the project's Site URL — which is how reset links end up pointing at
 * localhost. `NEXT_PUBLIC_SITE_URL` pins them to the real site.
 */
export async function requestPasswordReset(email: string): Promise<AuthState> {
  const supabase = await createClient();
  const siteUrl = await resolveSiteUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: siteUrl ? `${siteUrl}/auth/callback?next=/auth/reset-password` : undefined,
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
