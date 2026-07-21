import type { createClient } from "@/lib/supabase/server";

import { readViewAsTeacherId } from "./viewAs";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type RequireTeacherResult = { ok: true; userId: string } | { ok: false; error: string };

/**
 * Confirms the caller may author homework before any write. A `teacher` acts as
 * themselves; an `admin` with an active "View as Teacher" session acts on that
 * teacher's behalf (their writes are permitted by the admin homework policies in
 * 20260721000001_admin_view_as_teacher.sql). RLS independently restricts writes,
 * so this is defence-in-depth plus a friendly error message — mirrors
 * `requireAdmin` in `features/admin/requireAdmin.ts`.
 */
export async function requireTeacher(supabase: SupabaseServerClient): Promise<RequireTeacherResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "teacher") {
    return { ok: true, userId: user.id };
  }

  // An admin "viewing as" a teacher may author on that teacher's behalf.
  if (profile?.role === "admin") {
    const viewAsId = await readViewAsTeacherId();
    if (viewAsId) return { ok: true, userId: viewAsId };
  }

  return { ok: false, error: "Only teachers can manage homework." };
}
