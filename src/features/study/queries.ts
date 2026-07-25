import type { createClient } from "@/lib/supabase/server";

import { summarizeStudyTime, utcDayKey, type StudyTimeSummary } from "./studyTime";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type { StudyTimeSummary } from "./studyTime";

/**
 * How long a profile has spent on learning screens — today, over the last seven
 * days, and in total.
 *
 * Reads `study_time_daily` directly: RLS decides whose rows are visible (own,
 * a linked student's, a taught student's), so a caller who may not see them
 * gets an empty summary rather than an error — the same "nothing to show" the
 * dashboard renders before a student's first session.
 */
export async function getStudyTimeSummary(
  supabase: SupabaseServerClient,
  profileId: string
): Promise<StudyTimeSummary> {
  const { data } = await supabase
    .from("study_time_daily")
    .select("day, seconds")
    .eq("profile_id", profileId);

  return summarizeStudyTime(data ?? [], utcDayKey(new Date()));
}
