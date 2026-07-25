import AuthGuard from "@/components/auth/AuthGuard";
import { getMessages } from "@/features/i18n";
import { resolveLocale } from "@/features/i18n/server";
import { DEFAULT_KNOWLEDGE_LEVEL, KNOWLEDGE_LEVEL_LABELS } from "@/features/levels/levels";
import CityMapPreview from "@/features/map/CityMapPreview";
import { loadMapPreview } from "@/features/map/previewMap";
import { requireParentPage } from "@/features/parent/guard";
import { getLinkedStudent } from "@/features/parent/queries";

/**
 * Read-only city map for a parent at `/parent/map` — the districts and stops
 * their student works through, with everything the student has already finished
 * marked ✓, and nothing to play.
 *
 * The level shown is the *student's*: they pick it on their own profile, and a
 * parent following a different level's map would be looking at a city their
 * child never sees. Before a student is linked there is no level to follow, so
 * the map falls back to the default one.
 */
export default async function ParentMapPage() {
  const [{ supabase, profileId }, { locale }] = await Promise.all([
    requireParentPage(),
    resolveLocale(),
  ]);

  const messages = getMessages(locale);
  const student = await getLinkedStudent(supabase, profileId);
  const level = student?.level ?? DEFAULT_KNOWLEDGE_LEVEL;

  // No linked student yet — the dashboard explains why; here the map simply
  // shows the city with no progress on it.
  const districts = await loadMapPreview(supabase, level, student ? [student.id] : []);

  return (
    <AuthGuard>
      <CityMapPreview
        districts={districts}
        levelName={KNOWLEDGE_LEVEL_LABELS[level]}
        role="parent"
        subtitle={messages.map.subtitle}
        progressLabel={
          student ? (student.username ?? messages.dashboard.yourStudent) : null
        }
        locale={locale}
      />
    </AuthGuard>
  );
}
