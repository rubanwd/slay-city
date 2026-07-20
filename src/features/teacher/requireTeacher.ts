import type { createClient } from "@/lib/supabase/server";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type RequireTeacherResult = { ok: true; userId: string } | { ok: false; error: string };

/**
 * Confirms the caller is a signed-in teacher before any homework write. RLS on
 * `homework_topics`/`homework_tasks` independently restricts writes to the
 * group's own teacher, so this is defence-in-depth plus a friendly error
 * message — mirrors `requireAdmin` in `features/admin/requireAdmin.ts`.
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

  if (profile?.role !== "teacher") {
    return { ok: false, error: "Only teachers can manage homework." };
  }
  return { ok: true, userId: user.id };
}
