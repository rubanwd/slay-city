"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { AVATAR_OPTIONS } from "./avatars";

export type OnboardingState = {
  /** Present when the action failed — shown to the user. */
  error?: string;
};

const USERNAME_PATTERN = /^[a-zA-Z0-9_ ]+$/;
const MIN_AGE = 7;
const MAX_AGE = 14;

export async function createProfile(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const username = String(formData.get("username") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "");

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

  if (!AVATAR_OPTIONS.some((option) => option.url === avatarUrl)) {
    return { error: "Choose an avatar." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please log in again." };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    username,
    age,
    avatar_url: avatarUrl,
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
