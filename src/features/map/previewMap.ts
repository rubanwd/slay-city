import type { createClient } from "@/lib/supabase/server";
import type { KnowledgeLevel } from "@/types";

import {
  buildLocationProgress,
  buildMapViewModel,
  sumLocationRewards,
  type MapDistrictViewModel,
} from "./mapState";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Nobody's progress is involved in a preview — this stands in for "completed nothing". */
const NO_COMPLETED_MISSIONS: ReadonlySet<string> = new Set<string>();

/** Adults never enter a mission, so no stop ever points at a playable one. */
const NO_NEXT_MISSIONS: ReadonlyMap<string, string> = new Map<string, string>();

/**
 * Every published district of a level, with its published locations and how
 * much content each one holds — the data behind the read-only map that parents
 * and teachers browse (`CityMapPreview`).
 *
 * Deliberately progress-free: an adult account has none, so every stop comes
 * back "unlocked" with no next mission, and the mission counts describe the
 * content itself ("3 missions") rather than anyone's completion of it. The
 * child map (`/map`) is the one that mixes in `user_progress`.
 */
export async function loadMapPreview(
  supabase: SupabaseServerClient,
  level: KnowledgeLevel
): Promise<MapDistrictViewModel[]> {
  const [districtsRes, locationsRes, missionsRes] = await Promise.all([
    supabase
      .from("districts")
      .select("id, name, order_index, background_image_url")
      .eq("is_published", true)
      .eq("level", level)
      .order("order_index"),
    supabase
      .from("locations")
      .select("id, district_id, name, description, order_index, map_x, map_y, icon_url")
      .eq("is_published", true)
      .order("order_index"),
    supabase
      .from("missions")
      .select("id, location_id, order_index, xp_reward, coin_reward")
      .eq("is_published", true)
      .order("order_index"),
  ]);

  const districts = districtsRes.data ?? [];
  const publishedDistrictIds = new Set(districts.map((district) => district.id));
  const locations = (locationsRes.data ?? []).filter((location) =>
    publishedDistrictIds.has(location.district_id)
  );
  const missions = missionsRes.data ?? [];

  const { missionCountsByLocation } = buildLocationProgress(missions, NO_COMPLETED_MISSIONS);

  return buildMapViewModel(
    districts,
    locations,
    NO_COMPLETED_MISSIONS,
    NO_NEXT_MISSIONS,
    sumLocationRewards(missions),
    missionCountsByLocation
  );
}
