import AuthGuard from "@/components/auth/AuthGuard";
import { KNOWLEDGE_LEVEL_LABELS } from "@/features/levels/levels";
import { getMyLevel } from "@/features/levels/queries";
import CityMapPreview from "@/features/map/CityMapPreview";
import { loadMapPreview } from "@/features/map/previewMap";
import { requireParentPage } from "@/features/parent/guard";

/**
 * Read-only city map for a parent at `/parent/map` — the districts and stops
 * their child works through, without anything to play.
 *
 * The level comes from the parent's own profile, which defaults to Elementary
 * (the database default for every profile, and today the only level with
 * content). They can switch it on `/parent/profile` once other levels exist.
 */
export default async function ParentMapPage() {
  const { supabase, profileId } = await requireParentPage();

  const level = await getMyLevel(supabase, profileId);
  const districts = await loadMapPreview(supabase, level);

  return (
    <AuthGuard>
      <CityMapPreview
        districts={districts}
        levelName={KNOWLEDGE_LEVEL_LABELS[level]}
        role="parent"
        subtitle="What your child explores"
      />
    </AuthGuard>
  );
}
