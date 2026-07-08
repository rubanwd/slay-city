"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { ensureParentProfile, resolveHomePath } from "./roleRouting";

/** Result returned to a form on failure (or on a success that doesn't redirect). */
export type AuthState = {
  /** Present when the action failed — shown to the user. */
  error?: string;
  /** Present on a non-redirecting success, e.g. "confirm your email". */
  message?: string;
};

/** Roles a user may self-select at registration. Admin is never self-assigned. */
export type SignupRole = "child" | "parent";

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
  const siteUrl = await resolveSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: siteUrl ? `${siteUrl}/auth/callback` : undefined,
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
