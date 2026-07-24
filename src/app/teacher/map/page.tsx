import { KNOWLEDGE_LEVEL_LABELS } from "@/features/levels/levels";
import { getMyLevel } from "@/features/levels/queries";
import CityMapPreview from "@/features/map/CityMapPreview";
import { loadMapPreview } from "@/features/map/previewMap";
import { requireTeacherPage } from "@/features/teacher/guard";

/**
 * Read-only city map for a teacher at `/teacher/map` — the districts and stops
 * their students work through, without anything to play.
 *
 * The level is read from the signed-in account's own profile (defaulting to
 * Elementary, the database default and today's only level with content), not
 * from the impersonated teacher's: it is the account whose level the picker on
 * `/teacher/profile` actually changes.
 */
export default async function TeacherMapPage() {
  const { supabase, userId } = await requireTeacherPage();

  const level = await getMyLevel(supabase, userId);
  const districts = await loadMapPreview(supabase, level);

  return (
    <CityMapPreview
      districts={districts}
      levelName={KNOWLEDGE_LEVEL_LABELS[level]}
      role="teacher"
      subtitle="What your students explore"
    />
  );
}
