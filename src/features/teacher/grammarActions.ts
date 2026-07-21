"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  clampGrammarPointCount,
  MAX_GRAMMAR_TASKS,
  parseGeneratedGrammar,
  type GrammarDraftPoint,
  type GrammarDraftTask,
} from "@/features/homework/grammar";

import { extractJson, requestOpenRouterJson } from "./openRouterChat";
import { requireTeacher } from "./requireTeacher";
import { buildGrammarPrompt } from "./grammarPrompt";

/** A grammar point as submitted for publishing. */
export interface PublishGrammarPoint {
  title: string;
  explanation: string;
  example: string | null;
}

export type GenerateGrammarResult =
  | { ok: true; points: GrammarDraftPoint[]; tasks: GrammarDraftTask[] }
  | { ok: false; error: string };

export type GrammarActionResult = { ok: true } | { ok: false; error: string };

/**
 * Confirms the caller is a teacher (or admin viewing-as) AND can see the topic
 * — RLS on `homework_topics` already limits SELECT to the owning teacher / an
 * admin, so a successful read is proof of ownership. Returns the topic's group
 * id (for revalidation) or an error.
 */
async function requireTopicAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  topicId: string
): Promise<{ ok: true; groupId: string } | { ok: false; error: string }> {
  const teacher = await requireTeacher(supabase);
  if (!teacher.ok) return { ok: false, error: teacher.error };

  const { data: topic } = await supabase
    .from("homework_topics")
    .select("id, group_id")
    .eq("id", topicId)
    .maybeSingle();

  if (!topic) return { ok: false, error: "Topic not found or not yours to edit." };
  return { ok: true, groupId: topic.group_id };
}

function revalidateTopic(groupId: string, topicId: string): void {
  revalidatePath(`/teacher/groups/${groupId}/topics/${topicId}`);
  revalidatePath(`/teacher/groups/${groupId}`);
  revalidatePath("/homework", "layout");
}

/* ── AI generation (no DB writes — the teacher reviews first) ───────────────── */

export interface GenerateGrammarInput {
  topicId: string;
  topicTitle: string;
  topicDescription: string | null;
  extraInstructions: string | null;
  pointCount: number;
  taskCount: number;
}

/**
 * Drafts a grammar set (rule points + a test) from the topic via OpenRouter.
 * Writes nothing — the draft comes back for the teacher to review, edit, and
 * publish. Gated by topic ownership.
 */
export async function generateGrammarDraft(input: GenerateGrammarInput): Promise<GenerateGrammarResult> {
  const supabase = await createClient();
  const access = await requireTopicAccess(supabase, input.topicId);
  if (!access.ok) return { ok: false, error: access.error };

  const prompt = buildGrammarPrompt({
    topicTitle: input.topicTitle,
    topicDescription: input.topicDescription,
    extraInstructions: input.extraInstructions,
    pointCount: clampGrammarPointCount(input.pointCount),
    taskCount: Math.min(MAX_GRAMMAR_TASKS, Math.max(0, Math.round(input.taskCount))),
  });

  const result = await requestOpenRouterJson(prompt);
  if (!result.ok) return { ok: false, error: result.error };

  const { points, tasks } = parseGeneratedGrammar(extractJson(result.content));
  if (points.length === 0) {
    return { ok: false, error: "The AI didn't return any usable grammar points. Try again." };
  }

  return { ok: true, points, tasks };
}

/* ── Publish (replace the topic's whole grammar set + its test) ─────────────── */

export interface PublishGrammarInput {
  topicId: string;
  points: PublishGrammarPoint[];
  tasks: GrammarDraftTask[];
}

/**
 * Replaces the topic's grammar points and test in one shot: any existing
 * points/tasks are deleted, then the new ones inserted. The test tasks come
 * straight from the reviewed AI draft (grammar can't be built deterministically
 * the way the vocabulary test is). Existing pass records are left intact.
 */
export async function publishGrammar(input: PublishGrammarInput): Promise<GrammarActionResult> {
  const supabase = await createClient();
  const access = await requireTopicAccess(supabase, input.topicId);
  if (!access.ok) return { ok: false, error: access.error };

  const points = (input.points ?? [])
    .map((p) => ({
      title: String(p.title ?? "").trim(),
      explanation: String(p.explanation ?? "").trim(),
      example: String(p.example ?? "").trim() || null,
    }))
    .filter((p) => p.title && p.explanation);

  if (points.length === 0) {
    return { ok: false, error: "Add at least one grammar point with an explanation before publishing." };
  }

  // Replace: clear the existing set, then insert the new one.
  const { error: delPointsErr } = await supabase
    .from("homework_grammar_points")
    .delete()
    .eq("topic_id", input.topicId);
  if (delPointsErr) return { ok: false, error: delPointsErr.message };

  const { error: delTasksErr } = await supabase
    .from("homework_grammar_tasks")
    .delete()
    .eq("topic_id", input.topicId);
  if (delTasksErr) return { ok: false, error: delTasksErr.message };

  const { error: insPointsErr } = await supabase.from("homework_grammar_points").insert(
    points.map((p, index) => ({
      topic_id: input.topicId,
      title: p.title,
      explanation: p.explanation,
      example: p.example,
      order_index: index,
    }))
  );
  if (insPointsErr) return { ok: false, error: insPointsErr.message };

  const tasks = (input.tasks ?? []).slice(0, MAX_GRAMMAR_TASKS);
  if (tasks.length > 0) {
    const { error: insTasksErr } = await supabase.from("homework_grammar_tasks").insert(
      tasks.map((t, index) => ({
        topic_id: input.topicId,
        task_type: t.taskType,
        content: t.content,
        order_index: index,
      }))
    );
    if (insTasksErr) return { ok: false, error: insTasksErr.message };
  }

  revalidateTopic(access.groupId, input.topicId);
  return { ok: true };
}

/** Removes a topic's entire grammar set (points + test). */
export async function clearGrammar(topicId: string): Promise<GrammarActionResult> {
  const supabase = await createClient();
  const access = await requireTopicAccess(supabase, topicId);
  if (!access.ok) return { ok: false, error: access.error };

  const { error: pErr } = await supabase.from("homework_grammar_points").delete().eq("topic_id", topicId);
  if (pErr) return { ok: false, error: pErr.message };
  const { error: tErr } = await supabase.from("homework_grammar_tasks").delete().eq("topic_id", topicId);
  if (tErr) return { ok: false, error: tErr.message };

  revalidateTopic(access.groupId, topicId);
  return { ok: true };
}
