import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface RecentActivityItem {
  /** The completed mission's id. */
  missionId: string;
  /** Human-readable mission title, or a fallback if the mission was unpublished/removed. */
  title: string;
  /** ISO timestamp the mission was completed. */
  completedAt: string;
  /** Score recorded for the completion, if any. */
  score: number | null;
}

export interface ParentProgressSummary {
  /** Total missions the child has completed. */
  missionsCompleted: number;
  /** Current daily streak. */
  currentStreak: number;
  /** Best daily streak ever reached. */
  longestStreak: number;
  /** Distinct locations the child has unlocked (i.e. completed at least one mission in). */
  locationsUnlocked: number;
  /** Total published locations available in the game. */
  totalLocations: number;
  /** Count of vocabulary items belonging to completed missions. */
  vocabularyCount: number;
  /** Up to the five most recently completed missions, newest first. */
  recentActivity: RecentActivityItem[];
}

/**
 * Read-only progress summary for the parent dashboard.
 *
 * Joins `user_progress` (completed missions), `user_stats` (streaks),
 * `missions` (titles for recent activity) and `vocabulary_items` (words seen).
 * Every figure is derived from missions actually marked complete
 * (`completed_at IS NOT NULL`), so the dashboard only ever reflects real work.
 */
export async function getParentProgressSummary(
  supabase: SupabaseServerClient,
  profileId: string
): Promise<ParentProgressSummary> {
  const [progressRes, statsRes, totalLocationsRes] = await Promise.all([
    // Completed missions, newest first, with the mission title joined in.
    supabase
      .from("user_progress")
      .select("mission_id, location_id, completed_at, score, missions(title)")
      .eq("profile_id", profileId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false }),
    supabase
      .from("user_stats")
      .select("current_streak, longest_streak")
      .eq("profile_id", profileId)
      .maybeSingle(),
    supabase
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
  ]);

  const completed = progressRes.data ?? [];

  const completedMissionIds = [...new Set(completed.map((row) => row.mission_id))];
  const unlockedLocationIds = new Set(completed.map((row) => row.location_id));

  // Count vocabulary items belonging to any completed mission. Skip the query
  // entirely when nothing is completed — `.in()` with an empty list is wasteful.
  let vocabularyCount = 0;
  if (completedMissionIds.length > 0) {
    const { count } = await supabase
      .from("vocabulary_items")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .in("mission_id", completedMissionIds);
    vocabularyCount = count ?? 0;
  }

  const recentActivity: RecentActivityItem[] = completed.slice(0, 5).map((row) => ({
    missionId: row.mission_id,
    title: row.missions?.title ?? "Mission",
    // `completed_at` is guaranteed non-null by the query filter above.
    completedAt: row.completed_at as string,
    score: row.score,
  }));

  return {
    missionsCompleted: completed.length,
    currentStreak: statsRes.data?.current_streak ?? 0,
    longestStreak: statsRes.data?.longest_streak ?? 0,
    locationsUnlocked: unlockedLocationIds.size,
    totalLocations: totalLocationsRes.count ?? 0,
    vocabularyCount,
    recentActivity,
  };
}
