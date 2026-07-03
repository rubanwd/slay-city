"use server";

import { createClient } from "@/lib/supabase/server";

export type MissionCompletionResult =
  | {
      ok: true;
      /** True when the user had already completed this mission — no rewards re-granted. */
      alreadyCompleted: boolean;
      xpEarned: number;
      coinsEarned: number;
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

  return {
    ok: true,
    alreadyCompleted: result.already_completed,
    xpEarned: result.xp_earned,
    coinsEarned: result.coins_earned,
  };
}
