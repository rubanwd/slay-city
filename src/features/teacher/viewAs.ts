import { cookies } from "next/headers";

import type { SupabaseServerClient } from "./requireTeacher";
import { VIEW_AS_TEACHER_COOKIE } from "./viewAsCookie";

export { VIEW_AS_TEACHER_COOKIE };

/** Who the teacher console should render for on this request. */
export interface TeacherContext {
  /** The authenticated user actually driving the request (teacher or admin). */
  userId: string;
  /** That user's email, used only as a display fallback on the dashboard. */
  userEmail: string | null;
  /**
   * The teacher whose console is shown — the user's own id for a teacher, or
   * the impersonated teacher's id for an admin "viewing as" them. All teacher
   * queries key off this, not `userId`.
   */
  teacherId: string;
  /** Present only while an admin is viewing as a teacher; null otherwise. */
  viewingAs: { id: string; username: string } | null;
}

/** Reads the impersonated teacher id from the request cookies (null if none). */
export async function readViewAsTeacherId(): Promise<string | null> {
  const store = await cookies();
  return store.get(VIEW_AS_TEACHER_COOKIE)?.value ?? null;
}

/**
 * Resolves who the teacher console should render for. A `teacher` sees their
 * own console. An `admin` with an active "View as Teacher" cookie pointing at a
 * real teacher sees that teacher's console (impersonation). Anyone else returns
 * null and the caller redirects them away.
 */
export async function resolveTeacherContext(
  supabase: SupabaseServerClient
): Promise<TeacherContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "teacher") {
    return {
      userId: user.id,
      userEmail: user.email ?? null,
      teacherId: user.id,
      viewingAs: null,
    };
  }

  if (profile?.role === "admin") {
    const viewAsId = await readViewAsTeacherId();
    if (viewAsId) {
      const { data: teacher } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", viewAsId)
        .eq("role", "teacher")
        .maybeSingle();
      if (teacher) {
        return {
          userId: user.id,
          userEmail: user.email ?? null,
          teacherId: teacher.id,
          viewingAs: { id: teacher.id, username: teacher.username },
        };
      }
    }
  }

  return null;
}
