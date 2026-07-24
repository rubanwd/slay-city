import { BottomNav } from "@/components/layout";
import { DEFAULT_KNOWLEDGE_LEVEL, isKnowledgeLevel } from "@/features/levels/levels";
import { getAvailableLevels } from "@/features/levels/queries";
import ProfileScreen from "@/features/profile/ProfileScreen";
import { requireTeacherPage } from "@/features/teacher/guard";
import { DEFAULT_MASCOT_IMAGE } from "@/features/wardrobe/mascot";

/**
 * Teacher's own account screen at `/teacher/profile`. The same screen the child
 * gets, minus what only a player has: no equipped wardrobe look (the plain
 * snake stands in as the avatar) and no progress to reset.
 *
 * While an admin is "viewing as" a teacher, the name shown is the teacher's —
 * and the email is hidden rather than leaking the admin's, matching the
 * dashboard — but the level belongs to the signed-in account, because that is
 * the profile `set_my_knowledge_level` writes to.
 */
export default async function TeacherProfilePage() {
  const { supabase, userId, userEmail, teacherId, viewingAs } = await requireTeacherPage();

  const [teacherRes, levelRes, availableLevels] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", teacherId).maybeSingle(),
    supabase.from("profiles").select("level").eq("id", userId).maybeSingle(),
    getAvailableLevels(supabase),
  ]);

  const level = isKnowledgeLevel(levelRes.data?.level)
    ? levelRes.data.level
    : DEFAULT_KNOWLEDGE_LEVEL;

  return (
    <>
      <ProfileScreen
        username={teacherRes.data?.username ?? null}
        email={viewingAs ? null : userEmail}
        mascotImageUrl={DEFAULT_MASCOT_IMAGE}
        level={level}
        availableLevels={availableLevels}
        roleLabel="Teacher"
        levelHint="Sets which level your city map shows."
        showProgressReset={false}
      />
      <BottomNav role="teacher" />
    </>
  );
}
