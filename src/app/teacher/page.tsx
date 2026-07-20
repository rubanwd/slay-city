import TeacherDashboard from "@/features/teacher/TeacherDashboard";
import { requireTeacherPage } from "@/features/teacher/guard";
import { getTeacherGroups } from "@/features/teacher/queries";

/** Read-only teacher dashboard at `/teacher`: groups of students and their progress. */
export default async function TeacherPage() {
  const { supabase, user } = await requireTeacherPage();
  const groups = await getTeacherGroups(supabase, user.id);

  return <TeacherDashboard groups={groups} />;
}
