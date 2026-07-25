"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Adds one heartbeat of study time to the signed-in student's day.
 *
 * All the real work — clamping the interval, ignoring non-students, folding the
 * value into the (student, day) row — happens inside `record_study_time`
 * (20260725000004_study_time.sql); the browser has no write grant on the table.
 * Failures are swallowed on purpose: a lost heartbeat costs half a minute of
 * reporting accuracy and must never interrupt a child mid-mission.
 */
export async function recordStudyTime(seconds: number): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.rpc("record_study_time", { p_seconds: Math.round(seconds) });
}
