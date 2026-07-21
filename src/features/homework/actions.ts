"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type HomeworkTaskCompletionResult = { ok: true } | { ok: false; error: string };

/**
 * Records that the signed-in child finished one homework task. Deliberately a
 * plain table insert (not a SECURITY DEFINER RPC like `complete_mission`) —
 * unlike mission completion this never touches XP/coins/streak, so there's no
 * reward path to guard; RLS alone (`homework_completions_insert_own`) is
 * enough to keep a child from recording completions for tasks outside their
 * own groups or for another child.
 */
export async function completeHomeworkTask(taskId: string): Promise<HomeworkTaskCompletionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to save your progress." };
  }

  const { error } = await supabase
    .from("homework_task_completions")
    .insert({ task_id: taskId, child_id: user.id });

  // 23505 = unique_violation — already marked complete (e.g. replaying a
  // finished topic), treat as success rather than surfacing an error.
  if (error && error.code !== "23505") {
    return { ok: false, error: error.message };
  }

  revalidatePath("/homework", "layout");
  return { ok: true };
}

/**
 * Records that the signed-in child finished a topic's whole vocabulary flow
 * (all word cards + the test). Like {@link completeHomeworkTask} this is a plain
 * insert guarded only by RLS (`homework_vocab_completions_insert_own`) — no
 * XP/coins/streak, so there's no reward path to protect. A duplicate (replaying
 * a passed topic) is treated as success. Once inserted, both the child and the
 * assigning teacher can see the pass.
 */
export async function completeHomeworkVocab(topicId: string): Promise<HomeworkTaskCompletionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to save your progress." };
  }

  const { error } = await supabase
    .from("homework_vocab_completions")
    .insert({ topic_id: topicId, child_id: user.id });

  if (error && error.code !== "23505") {
    return { ok: false, error: error.message };
  }

  revalidatePath("/homework", "layout");
  return { ok: true };
}
