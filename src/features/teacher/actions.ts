"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { requireTeacher } from "./requireTeacher";

/** State returned to teacher forms via useActionState. */
export type TeacherFormState = {
  error?: string;
  success?: string;
};

/** Parses a non-negative integer from a form field, defaulting to `fallback`. */
function parseNonNegativeInt(raw: FormDataEntryValue | null, fallback = 0): number | null {
  const value = String(raw ?? "").trim();
  if (value === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

/** Parses an optional http(s) URL. Empty means "none" (`null`); present-but-invalid is rejected. */
function parseOptionalUrl(raw: FormDataEntryValue | null): string | null | undefined {
  const value = String(raw ?? "").trim();
  if (value === "") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
  } catch {
    return undefined;
  }
  return value;
}

function revalidateGroup(groupId: string): void {
  revalidatePath(`/teacher/groups/${groupId}`);
  // Homework pages are per-child server components — bust them too so a child
  // sees a topic/task change without waiting for their own next navigation.
  revalidatePath("/homework", "layout");
}

/* ── Homework topics ───────────────────────────────────────────────────────── */

export async function createHomeworkTopic(
  _prevState: TeacherFormState,
  formData: FormData
): Promise<TeacherFormState> {
  const supabase = await createClient();
  const teacher = await requireTeacher(supabase);
  if (!teacher.ok) return { error: teacher.error };

  const groupId = String(formData.get("group_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const orderIndex = parseNonNegativeInt(formData.get("order_index"));
  const noteLinkUrl = parseOptionalUrl(formData.get("note_link_url"));
  const noteImageUrl = parseOptionalUrl(formData.get("note_image_url"));

  if (!groupId) return { error: "A group is required." };
  if (!title) return { error: "Title is required." };
  if (orderIndex === null) return { error: "Order must be a non-negative whole number." };
  if (noteLinkUrl === undefined) return { error: "Link must be a valid http(s) URL." };
  if (noteImageUrl === undefined) return { error: "Image URL must be valid." };

  const { error } = await supabase.from("homework_topics").insert({
    group_id: groupId,
    title,
    description: description || null,
    order_index: orderIndex,
    note_link_url: noteLinkUrl,
    note_image_url: noteImageUrl,
  });

  if (error) return { error: error.message };

  revalidateGroup(groupId);
  return { success: `Topic "${title}" added.` };
}

export async function updateHomeworkTopic(
  _prevState: TeacherFormState,
  formData: FormData
): Promise<TeacherFormState> {
  const supabase = await createClient();
  const teacher = await requireTeacher(supabase);
  if (!teacher.ok) return { error: teacher.error };

  const id = String(formData.get("id") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const orderIndex = parseNonNegativeInt(formData.get("order_index"));
  const noteLinkUrl = parseOptionalUrl(formData.get("note_link_url"));
  const noteImageUrl = parseOptionalUrl(formData.get("note_image_url"));

  if (!id) return { error: "A topic is required." };
  if (!title) return { error: "Title is required." };
  if (orderIndex === null) return { error: "Order must be a non-negative whole number." };
  if (noteLinkUrl === undefined) return { error: "Link must be a valid http(s) URL." };
  if (noteImageUrl === undefined) return { error: "Image URL must be valid." };

  const { error } = await supabase
    .from("homework_topics")
    .update({
      title,
      description: description || null,
      order_index: orderIndex,
      note_link_url: noteLinkUrl,
      note_image_url: noteImageUrl,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (groupId) revalidateGroup(groupId);
  return { success: `Topic "${title}" updated.` };
}

export async function deleteHomeworkTopic(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const teacher = await requireTeacher(supabase);
  if (!teacher.ok) return;

  const id = String(formData.get("id") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();
  if (!id) return;

  const { error } = await supabase.from("homework_topics").delete().eq("id", id);
  if (!error && groupId) revalidateGroup(groupId);
}
