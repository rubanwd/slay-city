"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type HomeworkTaskCompletionResult = { ok: true } | { ok: false; error: string };

/**
 * Records that the signed-in child finished a topic's whole vocabulary flow
 * (all word cards + the test). A plain insert guarded only by RLS
 * (`homework_vocab_completions_insert_own`) — no
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

/**
 * Records that the signed-in child finished a topic's whole grammar flow (all
 * rule cards + the test). Mirrors {@link completeHomeworkVocab}: a plain insert
 * guarded only by RLS (`homework_grammar_completions_insert_own`), no
 * XP/coins/streak, and a duplicate (replaying a passed topic) is treated as
 * success. Once inserted, both the child and the assigning teacher can see it.
 */
export async function completeHomeworkGrammar(topicId: string): Promise<HomeworkTaskCompletionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to save your progress." };
  }

  const { error } = await supabase
    .from("homework_grammar_completions")
    .insert({ topic_id: topicId, child_id: user.id });

  if (error && error.code !== "23505") {
    return { ok: false, error: error.message };
  }

  revalidatePath("/homework", "layout");
  return { ok: true };
}
