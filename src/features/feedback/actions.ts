"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { validateFeedbackReport } from "./feedback";

export type SubmitFeedbackResult = { ok: true } | { ok: false; error: string };

export interface SubmitFeedbackInput {
  kind: string;
  message: string;
  imageUrls: string[];
}

/**
 * Files a bug report or a piece of feedback from the signed-in student or
 * teacher. RLS (`feedback_reports_insert_student_or_teacher`) is what actually
 * enforces the author and the allowed roles; the validation here exists to
 * reject bad input with a readable message instead of a constraint violation,
 * and to pin attached screenshots to our own storage.
 */
export async function submitFeedbackReport(
  input: SubmitFeedbackInput
): Promise<SubmitFeedbackResult> {
  const validated = validateFeedbackReport(input, process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (!validated.ok) return validated;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  // Same rule as the insert policy, checked here so the one case that can
  // legitimately hit this screen without permission — an admin previewing the
  // teacher console — gets an explanation instead of an RLS error.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "student" && profile?.role !== "teacher") {
    return { ok: false, error: "Only students and teachers can send reports." };
  }

  const { error } = await supabase.from("feedback_reports").insert({
    author_id: user.id,
    kind: validated.kind,
    message: validated.message,
    image_urls: validated.imageUrls,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/feedback");
  return { ok: true };
}

/**
 * Marks every report read for the signed-in admin, clearing the unread marker
 * next to the console's Feedback & Bugs section. Called when the inbox opens;
 * `mark_feedback_read` is idempotent and a no-op for non-admins, so this is
 * safe to fire and forget.
 */
export async function markAllFeedbackRead(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("mark_feedback_read");
}

/** Removes a handled report. RLS (`feedback_reports_delete_admin`) allows admins only. */
export async function deleteFeedbackReport(reportId: string): Promise<SubmitFeedbackResult> {
  if (!reportId) return { ok: false, error: "Missing report." };

  const supabase = await createClient();
  const { error } = await supabase.from("feedback_reports").delete().eq("id", reportId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/feedback");
  return { ok: true };
}
