import TeacherDashboard from "@/features/teacher/TeacherDashboard";
import { requireTeacherPage } from "@/features/teacher/guard";
import { getTeacherGroups } from "@/features/teacher/queries";

/** Read-only teacher dashboard at `/teacher`: groups of students and their progress. */
export default async function TeacherPage() {
  const { supabase, user } = await requireTeacherPage();
  const [groups, profileRes] = await Promise.all([
    getTeacherGroups(supabase, user.id),
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <TeacherDashboard groups={groups} username={profileRes.data?.username ?? null} email={user.email ?? null} />
  );
}
