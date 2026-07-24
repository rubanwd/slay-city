"use server";

import { randomUUID } from "node:crypto";

import { normalizeWordKey } from "@/features/homework/vocabulary";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requestOpenRouterImage } from "./openRouterImage";
import { requireAdmin } from "./requireAdmin";
import { buildTaskImagePrompt } from "./taskImagePrompt";
import { getTaskImageSlots } from "./taskImageSlots";
import type { MissionTaskType } from "./taskTypes";

/** One image still to generate for a mission. */
export interface PendingSlot {
  taskId: string;
  slotIndex: number;
  subject: string;
}

export type MissionImagePlan =
  | { ok: true; total: number; filled: number; missing: number; pending: PendingSlot[] }
  | { ok: false; error: string };

export type FillSlotResult =
  | { ok: true; status: "generated" | "reused" | "skipped" }
  | { ok: false; error: string };

/**
 * Lists every empty image slot across a mission's tasks, so the client can
 * generate them one at a time with a progress bar. Reading and counting here
 * (rather than trusting the client) keeps the plan authoritative.
 */
export async function getMissionImagePlan(missionId: string): Promise<MissionImagePlan> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { ok: false, error: admin.error };

  const { data: tasks, error } = await supabase
    .from("mission_tasks")
    .select("id, task_type, content")
    .eq("mission_id", missionId)
    .order("order_index");
  if (error) return { ok: false, error: error.message };

  let total = 0;
  let filled = 0;
  const pending: PendingSlot[] = [];

  for (const task of tasks ?? []) {
    const slots = getTaskImageSlots(task.task_type as MissionTaskType, task.content);
    slots.forEach((slot, slotIndex) => {
      if (!slot.subject.trim()) return;
      total += 1;
      if (slot.filled) {
        filled += 1;
      } else {
        pending.push({ taskId: task.id, slotIndex, subject: slot.subject });
      }
    });
  }

  return { ok: true, total, filled, missing: pending.length, pending };
}

/** data:image/…;base64,… → a Buffer + storage extension. */
function decodeDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; ext: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([^\n]*)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const ext = contentType === "image/jpeg" ? "jpg" : contentType === "image/webp" ? "webp" : "png";
  return { buffer, contentType, ext };
}

/**
 * Resolves a public image URL for `subject`, reusing the shared
 * `task_image_cache` before paying to generate. On a miss it generates via
 * OpenRouter, uploads to the `content/tasks` bucket with the admin's own
 * session (storage RLS already allows admins), and records the URL in the cache.
 */
async function resolveTaskImageUrl(
  supabase: SupabaseClient,
  subject: string
): Promise<{ url: string; reused: boolean }> {
  const key = normalizeWordKey(subject);
  if (key) {
    const { data: cached } = await supabase
      .from("task_image_cache")
      .select("image_url")
      .eq("word_key", key)
      .maybeSingle();
    if (cached?.image_url) return { url: cached.image_url, reused: true };
  }

  const generated = await requestOpenRouterImage(buildTaskImagePrompt({ subject }));
  if (!generated.ok) throw new Error(generated.error);

  const decoded = decodeDataUrl(generated.dataUrl);
  if (!decoded) throw new Error("The generated image was unreadable.");

  const path = `tasks/${randomUUID()}.${decoded.ext}`;
  const { error: uploadError } = await supabase.storage
    .from("content")
    .upload(path, decoded.buffer, { contentType: decoded.contentType, upsert: false });
  if (uploadError) throw uploadError;

  const url = supabase.storage.from("content").getPublicUrl(path).data.publicUrl;

  if (key) {
    const { error: cacheError } = await supabase
      .from("task_image_cache")
      .upsert({ word_key: key, image_url: url, updated_at: new Date().toISOString() }, { onConflict: "word_key" });
    if (cacheError) console.warn("task_image_cache upsert failed:", cacheError.message);
  }

  return { url, reused: false };
}

/**
 * Generates (or reuses) the image for a single slot and writes it back into the
 * task's content. Re-reads the task and re-derives its slots so it stays correct
 * even if the content changed since the plan was built, and no-ops when the slot
 * is already filled — making the whole flow safely retriable.
 */
export async function fillMissionImageSlot(taskId: string, slotIndex: number): Promise<FillSlotResult> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { ok: false, error: admin.error };

  const { data: task, error } = await supabase
    .from("mission_tasks")
    .select("id, task_type, content")
    .eq("id", taskId)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!task) return { ok: false, error: "Task not found." };

  const content = task.content;
  const slots = getTaskImageSlots(task.task_type as MissionTaskType, content);
  const slot = slots[slotIndex];
  if (!slot || slot.filled || !slot.subject.trim()) return { ok: true, status: "skipped" };

  try {
    const { url, reused } = await resolveTaskImageUrl(supabase, slot.subject);
    slot.apply(url); // mutates `content`
    const { error: updateError } = await supabase
      .from("mission_tasks")
      .update({ content })
      .eq("id", taskId);
    if (updateError) return { ok: false, error: updateError.message };
    return { ok: true, status: reused ? "reused" : "generated" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Image generation failed." };
  }
}
