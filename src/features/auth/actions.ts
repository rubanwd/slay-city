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

/**
 * Register a new account. On success with an active session the user is sent
 * straight to `/map`; if the project requires email confirmation, a message is
 * returned instead (there is no session yet).
 */
export async function signUp(email: string, password: string): Promise<AuthState> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/map");
  }

  return {
    message: "Account created! Check your email to confirm, then log in.",
  };
}

/** Log in with email + password. Redirects to `/map` on success. */
export async function signIn(email: string, password: string): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/map");
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

export async function registerFormAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  return signUp(email, password);
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
