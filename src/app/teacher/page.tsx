import TeacherDashboard from "@/features/teacher/TeacherDashboard";
import { requireTeacherPage } from "@/features/teacher/guard";
import { getTeacherGroups } from "@/features/teacher/queries";

/** Read-only teacher dashboard at `/teacher`: groups of students and their progress. */
export default async function TeacherPage() {
  const { supabase, teacherId, userEmail, viewingAs } = await requireTeacherPage();
  const [groups, profileRes] = await Promise.all([
    getTeacherGroups(supabase, teacherId),
    supabase.from("profiles").select("username").eq("id", teacherId).maybeSingle(),
  ]);

  return (
    <TeacherDashboard
      groups={groups}
      username={profileRes.data?.username ?? null}
      // While impersonating, fall back to the teacher's username only — never
      // leak the admin's own email into the teacher's header.
      email={viewingAs ? null : userEmail}
    />
  );
}
