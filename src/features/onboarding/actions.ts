"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isKnowledgeLevel, knowledgeLevelLabel } from "@/features/levels/levels";
import { getAvailableLevels } from "@/features/levels/queries";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = {
  /** Present when the action failed — shown to the user. */
  error?: string;
};

const USERNAME_PATTERN = /^[a-zA-Z0-9_ ]+$/;
const MIN_AGE = 5;
const MAX_AGE = 20;

export async function createProfile(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const username = String(formData.get("username") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const levelRaw = String(formData.get("level") ?? "").trim();

  if (username.length < 2 || username.length > 20) {
    return { error: "Username must be 2-20 characters." };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { error: "Username can only contain letters, numbers, spaces, and underscores." };
  }

  let age: number | null = null;
  if (ageRaw) {
    age = Number(ageRaw);
    if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
      return { error: `Age must be between ${MIN_AGE} and ${MAX_AGE}.` };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please log in again." };
  }

  // The picker only ever offers levels that have content, but the choice
  // arrives from the browser — re-check it here rather than trusting the form.
  const availableLevels = await getAvailableLevels(supabase);
  if (availableLevels.length === 0) {
    return { error: "No levels are open yet. Please try again later." };
  }
  if (!isKnowledgeLevel(levelRaw)) {
    return { error: "Choose your level." };
  }
  if (!availableLevels.includes(levelRaw)) {
    return { error: `${knowledgeLevelLabel(levelRaw)} has no content yet. Pick another level.` };
  }

  // No avatar_url: the player's avatar everywhere is their mascot wearing the
  // wardrobe item they have equipped, so there is nothing to pick at signup.
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    username,
    age,
    level: levelRaw,
    role: "child",
  });

  if (profileError) {
    if (profileError.code === "23505") {
      return { error: "That username is already taken." };
    }
    return { error: profileError.message };
  }

  const { error: statsError } = await supabase.from("user_stats").insert({
    profile_id: user.id,
    xp: 0,
    coins: 0,
    level: 1,
    current_streak: 0,
  });

  if (statsError) {
    return { error: statsError.message };
  }

  revalidatePath("/", "layout");
  redirect("/map");
}
