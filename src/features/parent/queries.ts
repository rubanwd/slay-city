import { getStudyTimeSummary, type StudyTimeSummary } from "@/features/study/queries";
import { loadMascotImage } from "@/features/wardrobe/loadMascot";
import { DEFAULT_KNOWLEDGE_LEVEL, isKnowledgeLevel } from "@/features/levels/levels";
import type { createClient } from "@/lib/supabase/server";
import type { KnowledgeLevel } from "@/types";

import { toHomeworkTopicProgress, type HomeworkTopicProgress } from "./homework";
import { taskFamilyOf, TASK_FAMILIES, type TaskFamily } from "./taskFamilies";

export type { HomeworkTopicProgress } from "./homework";

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

/** How many finished tasks fall into one kind of practice. */
export interface TaskFamilyCount {
  family: TaskFamily;
  count: number;
}

export interface ParentProgressSummary {
  /** Total missions the student has completed. */
  missionsCompleted: number;
  /** Current daily streak. */
  currentStreak: number;
  /** Best daily streak ever reached. */
  longestStreak: number;
  /** Distinct locations the student has unlocked (i.e. completed at least one mission in). */
  locationsUnlocked: number;
  /** Total published locations available in the game. */
  totalLocations: number;
  /** Count of vocabulary tasks (mission_tasks where task_type = 'vocabulary')
   * belonging to completed missions. */
  vocabularyCount: number;
  /** Every published task inside the missions the student has finished. */
  tasksCompleted: number;
  /** Those same tasks grouped into the three kinds of practice, biggest first. */
  taskFamilies: TaskFamilyCount[];
  /** Up to the five most recently completed missions, newest first. */
  recentActivity: RecentActivityItem[];
}

/**
 * Read-only progress summary for the parent dashboard.
 *
 * Joins `user_progress` (completed missions), `user_stats` (streaks),
 * `missions` (titles for recent activity) and `mission_tasks` (the tasks
 * actually played — the words a student learns live in each mission's tasks,
 * not in the separate, unused `vocabulary_items` table). Every figure is
 * derived from missions actually marked complete (`completed_at IS NOT NULL`),
 * so the dashboard only ever reflects real work.
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

  // The tasks inside completed missions are the actual authored content a
  // student has played (via mission_tasks.content), regardless of whether it
  // came from the seed data or the admin console. One fetch answers three
  // questions: how many tasks, how many of them were vocabulary, and what kinds
  // of practice they were. Skipped entirely when nothing is completed — `.in()`
  // with an empty list is wasteful.
  let vocabularyCount = 0;
  let tasksCompleted = 0;
  const countsByFamily = new Map<TaskFamily, number>();

  if (completedMissionIds.length > 0) {
    const { data: tasks } = await supabase
      .from("mission_tasks")
      .select("task_type")
      .eq("is_published", true)
      .in("mission_id", completedMissionIds);

    for (const task of tasks ?? []) {
      tasksCompleted += 1;
      if (task.task_type === "vocabulary") vocabularyCount += 1;
      const family = taskFamilyOf(task.task_type);
      countsByFamily.set(family, (countsByFamily.get(family) ?? 0) + 1);
    }
  }

  const taskFamilies = TASK_FAMILIES.map((family) => ({
    family,
    count: countsByFamily.get(family) ?? 0,
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

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
    tasksCompleted,
    taskFamilies,
    recentActivity,
  };
}

/** The student a parent follows, once the accounts are linked. */
export interface LinkedStudent {
  id: string;
  username: string | null;
  /** The knowledge level the student picked — the parent has none of their own. */
  level: KnowledgeLevel;
}

/**
 * The student account linked to this parent, or null while none is (the student
 * hasn't registered yet). Reads the link the dashboard establishes via
 * `link_student_by_email` — this is the read-only half, used by screens that
 * show the student's progress without owning the linking flow.
 */
export async function getLinkedStudent(
  supabase: SupabaseServerClient,
  parentId: string
): Promise<LinkedStudent | null> {
  const { data: links } = await supabase
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_id", parentId)
    .order("created_at")
    .limit(1);

  const studentId = links?.[0]?.student_id;
  if (!studentId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, level")
    .eq("id", studentId)
    .maybeSingle();

  return {
    id: studentId,
    username: profile?.username ?? null,
    level: isKnowledgeLevel(profile?.level) ? profile.level : DEFAULT_KNOWLEDGE_LEVEL,
  };
}

/** Who the student is right now — identity, level and the rewards they hold. */
export interface StudentSnapshot {
  id: string;
  /** Display name; falls back to the registered email upstream when unset. */
  username: string | null;
  /** The English level the student chose for themselves. */
  level: KnowledgeLevel;
  /** The look the student is wearing — their equipped wardrobe item, or the plain snake. */
  mascotImageUrl: string;
  xp: number;
  coins: number;
  /** Last day the streak job saw activity (`YYYY-MM-DD`), or null before the first. */
  lastActivityDate: string | null;
}

export interface ParentDashboardData {
  student: StudentSnapshot;
  progress: ParentProgressSummary;
  studyTime: StudyTimeSummary;
  homework: HomeworkTopicProgress[];
}

/**
 * Everything the parent dashboard shows about one student, in a single pass.
 *
 * Each piece is guarded by its own RLS rule or SECURITY DEFINER check, so a
 * caller who is not this student's parent gets empty sections rather than
 * another family's data: profile/stats/progress via the
 * `*_select_linked_student` policies, the equipped look via
 * `user_wardrobe_items_select_linked_student`, study time via
 * `study_time_select_linked_student`, and homework via
 * `parent_student_homework()`.
 */
export async function getParentDashboardData(
  supabase: SupabaseServerClient,
  studentId: string
): Promise<ParentDashboardData> {
  const [profileRes, statsRes, mascotImageUrl, progress, studyTime, homeworkRes] =
    await Promise.all([
      supabase.from("profiles").select("username, level").eq("id", studentId).maybeSingle(),
      supabase
        .from("user_stats")
        .select("xp, coins, last_activity_date")
        .eq("profile_id", studentId)
        .maybeSingle(),
      loadMascotImage(supabase, studentId),
      getParentProgressSummary(supabase, studentId),
      getStudyTimeSummary(supabase, studentId),
      supabase.rpc("parent_student_homework", { p_student_id: studentId }),
    ]);

  const homework = (homeworkRes.data ?? []).map(toHomeworkTopicProgress);

  return {
    student: {
      id: studentId,
      username: profileRes.data?.username ?? null,
      level: isKnowledgeLevel(profileRes.data?.level)
        ? profileRes.data.level
        : DEFAULT_KNOWLEDGE_LEVEL,
      mascotImageUrl,
      xp: statsRes.data?.xp ?? 0,
      coins: statsRes.data?.coins ?? 0,
      lastActivityDate: statsRes.data?.last_activity_date ?? null,
    },
    progress,
    studyTime,
    homework,
  };
}
