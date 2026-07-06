"use server";

import { createClient } from "@/lib/supabase/server";

export type MissionCompletionResult =
  | {
      ok: true;
      /** True when the user had already completed this mission — no rewards re-granted. */
      alreadyCompleted: boolean;
      xpEarned: number;
      coinsEarned: number;
      /**
       * Streak values after this completion, or null if the streak update
       * failed. The mission still counts as completed either way.
       */
      currentStreak: number | null;
      longestStreak: number | null;
    }
  | { ok: false; error: string };

/**
 * Records completion of a mission and grants its rewards.
 *
 * All the privileged work — inserting the progress row and incrementing
 * user_stats — happens inside the `complete_mission` SECURITY DEFINER function.
 * Authenticated users have no UPDATE grant on user_stats, so XP/coins can only
 * ever be changed server-side through that function, which also guards (via a
 * unique index) against granting rewards twice.
 */
export async function submitMissionCompletion(
  missionId: string
): Promise<MissionCompletionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to complete a mission." };
  }

  const { data, error } = await supabase.rpc("complete_mission", {
    p_mission_id: missionId,
  });

  if (error) {
    if (error.message.includes("Mission not found")) {
      return { ok: false, error: "Mission not found." };
    }
    return { ok: false, error: error.message };
  }

  const result = data?.[0];
  if (!result) {
    return { ok: false, error: "Mission could not be completed." };
  }

  // Update the daily streak server-side, after the progress row exists. This is
  // best-effort: the mission is already recorded and rewards granted, so a
  // streak hiccup must never fail the whole submission. The update-streak Edge
  // Function is idempotent per day, so calling it on every completion (including
  // a same-day replay) can never double-count the streak.
  const { currentStreak, longestStreak } = await updateStreak(supabase, user.id);

  return {
    ok: true,
    alreadyCompleted: result.already_completed,
    xpEarned: result.xp_earned,
    coinsEarned: result.coins_earned,
    currentStreak,
    longestStreak,
  };
}

type StreakValues = { currentStreak: number | null; longestStreak: number | null };

/**
 * Invokes the `update-streak` Edge Function, which owns all writes to
 * user_stats (the browser has no UPDATE grant there). Failures are swallowed
 * and reported as null streaks so they can't block a completed mission.
 */
async function updateStreak(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string
): Promise<StreakValues> {
  // Forward the caller's access token so the Edge Function can verify the JWT
  // and confirm the profile_id belongs to this user.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { currentStreak: null, longestStreak: null };
  }

  const { data, error } = await supabase.functions.invoke<{
    current_streak: number;
    longest_streak: number;
    last_activity_date: string;
  }>("update-streak", {
    body: { profile_id: profileId },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error || !data) {
    return { currentStreak: null, longestStreak: null };
  }

  return {
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
  };
}
