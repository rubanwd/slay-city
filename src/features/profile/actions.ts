"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { checkUsername, type UsernameProblem } from "./username";

export type ChangeUsernameResult =
  | { ok: true; username: string }
  | { ok: false; problem: UsernameProblem };

/**
 * Renames the signed-in user. The player picks their name at signup, when they
 * are new and typing fast — this is how they fix a typo or grow into a
 * different name later.
 *
 * The write goes straight to `profiles` under the `profiles_update_own` RLS
 * policy, so a request can only ever touch the caller's own row. Nothing about
 * gameplay hangs off the name: XP, coins, and progress are keyed by profile id.
 */
export async function changeMyUsername(raw: string): Promise<ChangeUsernameResult> {
  const check = checkUsername(String(raw ?? ""));
  if (!check.ok) {
    return { ok: false, problem: check.problem };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, problem: "unknown" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username: check.username })
    .eq("id", user.id);

  if (error) {
    // 23505 = unique_violation on profiles.username.
    return { ok: false, problem: error.code === "23505" ? "taken" : "unknown" };
  }

  // The name shows up in the profile header, the teacher's student list, and
  // the parent dashboard — refresh everything rather than a single route.
  revalidatePath("/", "layout");
  return { ok: true, username: check.username };
}
