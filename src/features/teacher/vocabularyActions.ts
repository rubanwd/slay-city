"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requestOpenRouterImage } from "@/features/admin/openRouterImage";
import {
  buildVocabTest,
  clampWordCount,
  parseGeneratedWords,
  type VocabDraftWord,
} from "@/features/homework/vocabulary";

import { extractJson, requestOpenRouterJson } from "./openRouterChat";
import { requireTeacher } from "./requireTeacher";
import { buildVocabularyPrompt, buildWordImagePrompt } from "./vocabularyPrompt";

const MAX_TASK_COUNT = 20;

/** A word as submitted for publishing — image already uploaded to storage by the client. */
export interface PublishWordInput {
  word: string;
  transcription: string | null;
  translation: string | null;
  imageUrl: string | null;
}

export type GenerateDraftResult =
  | { ok: true; words: VocabDraftWord[] }
  | { ok: false; error: string };

export type GenerateImageResult = { ok: true; dataUrl: string } | { ok: false; error: string };

export type VocabActionResult = { ok: true } | { ok: false; error: string };

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

export interface GenerateDraftInput {
  topicId: string;
  topicTitle: string;
  topicDescription: string | null;
  extraInstructions: string | null;
  wordCount: number;
}

/**
 * Drafts a vocabulary word set from the topic via OpenRouter. Writes nothing —
 * the words come back for the teacher to review, generate images for, and
 * publish. Gated by topic ownership.
 */
export async function generateVocabularyDraft(input: GenerateDraftInput): Promise<GenerateDraftResult> {
  const supabase = await createClient();
  const access = await requireTopicAccess(supabase, input.topicId);
  if (!access.ok) return { ok: false, error: access.error };

  const prompt = buildVocabularyPrompt({
    topicTitle: input.topicTitle,
    topicDescription: input.topicDescription,
    extraInstructions: input.extraInstructions,
    wordCount: clampWordCount(input.wordCount),
  });

  const result = await requestOpenRouterJson(prompt);
  if (!result.ok) return { ok: false, error: result.error };

  const words = parseGeneratedWords(extractJson(result.content));
  if (words.length === 0) {
    return { ok: false, error: "The AI didn't return any usable words. Try again." };
  }

  return { ok: true, words };
}

export interface GenerateImageInput {
  topicId: string;
  word: string;
  imagePrompt: string | null;
}

/**
 * Generates one word's flashcard illustration and returns it as a data URL for
 * preview. Nothing is uploaded here — the client uploads the chosen images to
 * storage on publish, mirroring the admin location-icon flow.
 */
export async function generateWordImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  const supabase = await createClient();
  const access = await requireTopicAccess(supabase, input.topicId);
  if (!access.ok) return { ok: false, error: access.error };

  const word = String(input.word ?? "").trim();
  if (!word) return { ok: false, error: "Give the word before generating an image." };

  const result = await requestOpenRouterImage(buildWordImagePrompt(word, input.imagePrompt));
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, dataUrl: result.dataUrl };
}

/* ── Publish (replace the topic's whole vocabulary set + rebuild its test) ──── */

export interface PublishVocabularyInput {
  topicId: string;
  words: PublishWordInput[];
  /** How many test tasks to build from the words. */
  taskCount: number;
}

/**
 * Replaces the topic's vocabulary words and rebuilds its test in one shot: any
 * existing words/tasks are deleted, the new words inserted, and a deterministic
 * test of `taskCount` tasks generated from them. Existing pass records are left
 * intact — a child who already passed stays passed.
 */
export async function publishVocabulary(input: PublishVocabularyInput): Promise<VocabActionResult> {
  const supabase = await createClient();
  const access = await requireTopicAccess(supabase, input.topicId);
  if (!access.ok) return { ok: false, error: access.error };

  const words = (input.words ?? [])
    .map((w) => ({
      word: String(w.word ?? "").trim(),
      transcription: String(w.transcription ?? "").trim() || null,
      translation: String(w.translation ?? "").trim(),
      imageUrl: String(w.imageUrl ?? "").trim() || null,
    }))
    .filter((w) => w.word && w.translation);

  if (words.length === 0) {
    return { ok: false, error: "Add at least one word with a translation before publishing." };
  }

  // Replace: clear the existing set, then insert the new one.
  const { error: delWordsErr } = await supabase
    .from("homework_vocab_words")
    .delete()
    .eq("topic_id", input.topicId);
  if (delWordsErr) return { ok: false, error: delWordsErr.message };

  const { error: delTasksErr } = await supabase
    .from("homework_vocab_tasks")
    .delete()
    .eq("topic_id", input.topicId);
  if (delTasksErr) return { ok: false, error: delTasksErr.message };

  const { error: insWordsErr } = await supabase.from("homework_vocab_words").insert(
    words.map((w, index) => ({
      topic_id: input.topicId,
      word: w.word,
      transcription: w.transcription,
      translation: w.translation,
      image_url: w.imageUrl,
      order_index: index,
    }))
  );
  if (insWordsErr) return { ok: false, error: insWordsErr.message };

  const taskCount = Math.min(MAX_TASK_COUNT, Math.max(0, Math.round(input.taskCount)));
  const tasks = buildVocabTest(
    words.map((w) => ({ word: w.word, translation: w.translation, imageUrl: w.imageUrl })),
    taskCount
  );

  if (tasks.length > 0) {
    const { error: insTasksErr } = await supabase.from("homework_vocab_tasks").insert(
      tasks.map((t) => ({
        topic_id: input.topicId,
        task_type: t.taskType,
        content: t.content,
        order_index: t.orderIndex,
      }))
    );
    if (insTasksErr) return { ok: false, error: insTasksErr.message };
  }

  revalidateTopic(access.groupId, input.topicId);
  return { ok: true };
}

/** Removes a topic's entire vocabulary set (words + test). */
export async function clearVocabulary(topicId: string): Promise<VocabActionResult> {
  const supabase = await createClient();
  const access = await requireTopicAccess(supabase, topicId);
  if (!access.ok) return { ok: false, error: access.error };

  const { error: wErr } = await supabase.from("homework_vocab_words").delete().eq("topic_id", topicId);
  if (wErr) return { ok: false, error: wErr.message };
  const { error: tErr } = await supabase.from("homework_vocab_tasks").delete().eq("topic_id", topicId);
  if (tErr) return { ok: false, error: tErr.message };

  revalidateTopic(access.groupId, topicId);
  return { ok: true };
}
