import type { createClient } from "@/lib/supabase/server";
import type { KnowledgeLevel } from "@/types";

import {
  buildLocationProgress,
  buildMapViewModel,
  sumLocationRewards,
  type MapDistrictViewModel,
} from "./mapState";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Adults never enter a mission, so no stop ever points at a playable one. */
const NO_NEXT_MISSIONS: ReadonlyMap<string, string> = new Map<string, string>();

/**
 * The missions every one of `profileIds` has completed.
 *
 * "Every one" rather than "any one" so a ✓ on the map always means everyone the
 * viewer follows is done there — for a parent that is simply their child; for a
 * teacher it is the whole class. RLS decides what is readable at all
 * (`user_progress_select_linked_child` / `user_progress_select_group_child`),
 * so a profile the viewer may not read contributes nothing and its stops stay
 * unmarked rather than wrongly ✓.
 */
async function loadSharedCompletedMissions(
  supabase: SupabaseServerClient,
  profileIds: readonly string[]
): Promise<Set<string>> {
  if (profileIds.length === 0) return new Set();

  const { data } = await supabase
    .from("user_progress")
    .select("profile_id, mission_id")
    .in("profile_id", [...profileIds])
    .not("completed_at", "is", null);

  // One profile can have several rows for the same mission (replays), so count
  // distinct profiles per mission rather than rows.
  const profilesByMission = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const profiles = profilesByMission.get(row.mission_id) ?? new Set<string>();
    profiles.add(row.profile_id);
    profilesByMission.set(row.mission_id, profiles);
  }

  const completedByEveryone = new Set<string>();
  for (const [missionId, profiles] of profilesByMission) {
    if (profiles.size === profileIds.length) completedByEveryone.add(missionId);
  }
  return completedByEveryone;
}

/**
 * Every published district of a level, with its published locations and how
 * much content each one holds — the data behind the read-only map that parents
 * and teachers browse (`CityMapPreview`).
 *
 * `followedProfileIds` are the players whose progress the map reflects: the
 * parent's linked child, or a teacher's students. A location comes back
 * "completed" once all of them have finished every mission there. Pass none and
 * the map is pure content — nothing completed, nothing counted.
 *
 * Nothing here ever points at a playable mission, since an adult cannot enter
 * one; the child map (`/map`) stays the only screen that mixes progress with a
 * next mission to play.
 */
export async function loadMapPreview(
  supabase: SupabaseServerClient,
  level: KnowledgeLevel,
  followedProfileIds: readonly string[] = []
): Promise<MapDistrictViewModel[]> {
  const [districtsRes, locationsRes, missionsRes, completedMissionIds] = await Promise.all([
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
    loadSharedCompletedMissions(supabase, followedProfileIds),
  ]);

  const districts = districtsRes.data ?? [];
  const publishedDistrictIds = new Set(districts.map((district) => district.id));
  const locations = (locationsRes.data ?? []).filter((location) =>
    publishedDistrictIds.has(location.district_id)
  );
  const missions = missionsRes.data ?? [];

  const { completedLocationIds, missionCountsByLocation } = buildLocationProgress(
    missions,
    completedMissionIds
  );

  return buildMapViewModel(
    districts,
    locations,
    completedLocationIds,
    NO_NEXT_MISSIONS,
    sumLocationRewards(missions),
    missionCountsByLocation
  );
}
