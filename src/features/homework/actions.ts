"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type HomeworkTaskCompletionResult =
  | { ok: true; xpEarned: number; alreadyPassed: boolean }
  | { ok: false; error: string };

/**
 * Records that the signed-in student finished a topic's whole vocabulary flow
 * (all word cards + the test) and grants XP for a first-time pass. The reward
 * is applied inside the `complete_homework_vocab` SECURITY DEFINER function —
 * the browser has no UPDATE grant on user_stats, so XP can only be added
 * server-side, and its unique completion row makes the grant idempotent
 * (replaying a passed topic returns `alreadyPassed` with `xpEarned: 0`). Once
 * recorded, both the student and the assigning teacher can see the pass.
 */
export async function completeHomeworkVocab(topicId: string): Promise<HomeworkTaskCompletionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to save your progress." };
  }

  const { data, error } = await supabase
    .rpc("complete_homework_vocab", { p_topic_id: topicId })
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/homework", "layout");
  return { ok: true, xpEarned: data.xp_earned, alreadyPassed: data.already_completed };
}

/**
 * Records that the signed-in student finished a topic's whole grammar flow (all
 * rule cards + the test) and grants XP for a first-time pass. Mirrors
 * {@link completeHomeworkVocab}: the `complete_homework_grammar` SECURITY
 * DEFINER function performs the idempotent XP grant server-side, and a
 * duplicate (replaying a passed topic) returns `alreadyPassed` with no re-grant.
 */
export async function completeHomeworkGrammar(topicId: string): Promise<HomeworkTaskCompletionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to save your progress." };
  }

  const { data, error } = await supabase
    .rpc("complete_homework_grammar", { p_topic_id: topicId })
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/homework", "layout");
  return { ok: true, xpEarned: data.xp_earned, alreadyPassed: data.already_completed };
}
