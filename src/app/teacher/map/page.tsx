import { KNOWLEDGE_LEVEL_LABELS } from "@/features/levels/levels";
import { getMyLevel } from "@/features/levels/queries";
import CityMapPreview from "@/features/map/CityMapPreview";
import { loadMapPreview } from "@/features/map/previewMap";
import { requireTeacherPage } from "@/features/teacher/guard";

/**
 * City map for a teacher at `/teacher/map` — the whole city as a child sees it,
 * to check what the missions actually ask of them.
 *
 * Nothing is gated and nothing is scored: every district and stop is open (a
 * teacher is inspecting content, not progressing through it), no student's
 * completions are drawn on the map — the dashboard is where student progress
 * lives — and opening a stop leads to its missions, which run in review mode
 * with no rewards and no record (`/teacher/location/[locationId]`).
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
      subtitle="Every district and mission"
      locationHrefBase="/teacher/location"
    />
  );
}
