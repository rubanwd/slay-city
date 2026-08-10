"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { DEFAULT_KNOWLEDGE_LEVEL, isKnowledgeLevel } from "@/features/levels/levels";
import { checkUsername, usernameProblemMessage } from "@/features/profile/username";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import type { AdminFormState } from "./actions";
import { requireAdmin } from "./requireAdmin";
import { isUserRole, userAdminErrorMessage } from "./userRoles";

const USERS_PATH = "/admin/users";

/** Supabase's own minimum. Checked here so the admin sees it before the API does. */
const MIN_PASSWORD_LENGTH = 6;

/**
 * Creates a brand-new account from the admin console.
 *
 * There is no service-role key in this project (see AGENTS.md), so there is no
 * `auth.admin.createUser` to call: the account is registered through the public
 * sign-up API on a throwaway client. That client must NOT be the request-scoped
 * one — signing up returns a session, and writing it into the cookie jar would
 * swap the admin's own session for the new user's. `persistSession: false` on a
 * standalone client keeps the admin signed in as themselves.
 *
 * The profile row is then created by `admin_create_profile`, which also seeds
 * `user_stats` for the roles that need it — the same shape onboarding produces.
 */
export async function createUser(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "").trim();
  const levelRaw = String(formData.get("level") ?? "").trim();

  if (!email) return { error: "Enter an email." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (!isUserRole(roleRaw)) return { error: "Pick a role." };

  const usernameCheck = checkUsername(String(formData.get("username") ?? ""));
  if (!usernameCheck.ok) return { error: usernameProblemMessage(usernameCheck.problem) };
  const username = usernameCheck.username;

  // Only students study a curriculum; the field is hidden for every other role.
  const level =
    roleRaw === "student" && isKnowledgeLevel(levelRaw) ? levelRaw : DEFAULT_KNOWLEDGE_LEVEL;

  const signUpClient = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data, error } = await signUpClient.auth.signUp({
    email,
    password,
    // `student`/`parent` is what the normal register form stashes here; admin
    // and teacher are never trusted from user metadata, so they aren't sent.
    options:
      roleRaw === "student" || roleRaw === "parent" ? { data: { role: roleRaw } } : undefined,
  });

  if (error) return { error: error.message };

  const userId = data.user?.id;
  if (!userId) {
    return { error: "Supabase didn't return the new account. Try again." };
  }
  // Supabase hides "this email is taken" behind an identity-less user when
  // email confirmations are on. Treat that as the duplicate it is.
  if ((data.user?.identities?.length ?? 0) === 0) {
    return { error: "An account with that email already exists." };
  }

  const { data: created, error: profileError } = await supabase.rpc("admin_create_profile", {
    p_user_id: userId,
    p_username: username,
    p_role: roleRaw,
    p_level: level,
  });

  if (profileError) return { error: profileError.message };

  const result = created?.[0];
  if (!result?.success) {
    return {
      error: userAdminErrorMessage(
        result?.reason,
        "The account was created but its profile wasn't. Set their role from the list."
      ),
    };
  }

  revalidatePath(USERS_PATH);
  return {
    success: data.session
      ? `${username} can sign in now.`
      : `${username} was created — they may need to confirm their email first.`,
  };
}

/**
 * Moves an account between the four roles via `admin_set_user_role`, which also
 * cleans up what the old role owned (a teacher's groups, an admin's allow-list
 * entry) and refuses to let an admin demote themselves.
 */
export async function setUserRole(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const profileId = String(formData.get("profile_id") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "").trim();
  if (!profileId) return { error: "Pick an account." };
  if (!isUserRole(roleRaw)) return { error: "Pick a role." };

  const { data, error } = await supabase.rpc("admin_set_user_role", {
    p_profile_id: profileId,
    p_role: roleRaw,
  });
  if (error) return { error: error.message };

  const result = data?.[0];
  if (!result?.success) {
    return { error: userAdminErrorMessage(result?.reason, "Couldn't change that role.") };
  }

  revalidatePath(USERS_PATH);
  revalidatePath("/admin/teachers");
  return { success: result.reason === "unchanged" ? "Already that role." : "Role updated." };
}

/**
 * Deletes the account itself (`admin_delete_user`). Everything the user owns
 * cascades off `auth.users`, so their progress, stats, wardrobe, groups and
 * homework go with them — there is no undo.
 */
export async function deleteUser(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const profileId = String(formData.get("profile_id") ?? "").trim();
  if (!profileId) return { error: "Pick an account." };

  const { data, error } = await supabase.rpc("admin_delete_user", { p_profile_id: profileId });
  if (error) return { error: error.message };

  const result = data?.[0];
  if (!result?.success) {
    return { error: userAdminErrorMessage(result?.reason, "Couldn't delete that account.") };
  }

  revalidatePath(USERS_PATH);
  revalidatePath("/admin/teachers");
  return { success: "Account deleted." };
}
