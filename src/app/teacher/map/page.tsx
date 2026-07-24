import { KNOWLEDGE_LEVEL_LABELS } from "@/features/levels/levels";
import { getMyLevel } from "@/features/levels/queries";
import CityMapPreview from "@/features/map/CityMapPreview";
import { loadMapPreview } from "@/features/map/previewMap";
import { requireTeacherPage } from "@/features/teacher/guard";
import { getTeacherStudentIds } from "@/features/teacher/queries";

/**
 * Read-only city map for a teacher at `/teacher/map` — the districts and stops
 * their students work through, with nothing to play.
 *
 * A stop is marked ✓ once *every* student in the teacher's groups has finished
 * it, so the marks read as "the class is done here" rather than "somebody was
 * here". A teacher with no students yet sees the plain city.
 *
 * The level is read from the signed-in account's own profile (defaulting to
 * Elementary, the database default and today's only level with content), not
 * from the impersonated teacher's: it is the account whose level the picker on
 * `/teacher/profile` actually changes.
 */
export default async function TeacherMapPage() {
  const { supabase, userId, teacherId } = await requireTeacherPage();

  const [level, studentIds] = await Promise.all([
    getMyLevel(supabase, userId),
    getTeacherStudentIds(supabase, teacherId),
  ]);

  const districts = await loadMapPreview(supabase, level, studentIds);

  return (
    <CityMapPreview
      districts={districts}
      levelName={KNOWLEDGE_LEVEL_LABELS[level]}
      role="teacher"
      subtitle="What your students explore"
      progressLabel={
        studentIds.length === 0
          ? null
          : studentIds.length === 1
            ? "your student"
            : "every student"
      }
    />
  );
}
