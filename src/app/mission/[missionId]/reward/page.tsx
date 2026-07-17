import { notFound, redirect } from "next/navigation";

import AuthGuard from "@/components/auth/AuthGuard";
import {
  buildLocationProgress,
  buildMapViewModel,
  defaultSelectedLocation,
  selectActiveDistrict,
} from "@/features/map/mapState";
import RewardScreen from "@/features/reward/RewardScreen";
import { createClient } from "@/lib/supabase/server";

interface MissionRewardPageProps {
  params: Promise<{ missionId: string }>;
}

export default async function MissionRewardPage({ params }: MissionRewardPageProps) {
  const { missionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/map");
  }

  const { data: mission } = await supabase
    .from("missions")
    .select("id, title, xp_reward, coin_reward")
    .eq("id", missionId)
    .eq("is_published", true)
    .maybeSingle();

  if (!mission) {
    notFound();
  }

  // Only show the reward screen to a user who has actually completed the mission —
  // otherwise there is no reward data to display, so send them back to the map.
  const { data: progress } = await supabase
    .from("user_progress")
    .select("id")
    .eq("profile_id", user.id)
    .eq("mission_id", missionId)
    .maybeSingle();

  if (!progress) {
    redirect("/map");
  }

  // Pull the streak (post-completion) and the map data needed to name the next
  // stop the player just unlocked. Reward figures come straight from the mission
  // row the completion action granted, so they match what was computed server-side.
  const [statsRes, districtsRes, locationsRes, missionsRes, progressRes] = await Promise.all([
    supabase
      .from("user_stats")
      .select("current_streak")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("districts")
      .select("id, name, order_index, background_image_url")
      .eq("is_published", true)
      .order("order_index"),
    supabase
      .from("locations")
      .select("id, district_id, name, description, order_index, map_x, map_y, icon_url")
      .eq("is_published", true)
      .order("order_index"),
    supabase
      .from("missions")
      .select("id, location_id, order_index")
      .eq("is_published", true)
      .order("order_index"),
    supabase.from("user_progress").select("mission_id, completed_at").eq("profile_id", user.id),
  ]);

  const districts = districtsRes.data ?? [];
  const publishedDistrictIds = new Set(districts.map((d) => d.id));
  const locations = (locationsRes.data ?? []).filter((loc) =>
    publishedDistrictIds.has(loc.district_id)
  );

  const completedMissionIds = new Set(
    (progressRes.data ?? []).filter((row) => row.completed_at !== null).map((row) => row.mission_id)
  );

  const { completedLocationIds, nextMissionIdByLocation } = buildLocationProgress(
    missionsRes.data ?? [],
    completedMissionIds
  );

  const mapDistricts = buildMapViewModel(
    districts,
    locations,
    completedLocationIds,
    nextMissionIdByLocation
  );

  // The frontier stop in the active district — where the mascot will stand
  // when the player returns to the map.
  const activeDistrict = selectActiveDistrict(mapDistricts);
  const nextLocation = activeDistrict
    ? defaultSelectedLocation(activeDistrict.locations)
    : null;
  const nextStop = nextLocation
    ? { name: nextLocation.name, iconUrl: nextLocation.iconUrl }
    : null;

  return (
    <AuthGuard>
      <RewardScreen
        coins={mission.coin_reward}
        xp={mission.xp_reward}
        streak={statsRes.data?.current_streak ?? 0}
        nextStop={nextStop}
        continueHref="/map"
      />
    </AuthGuard>
  );
}
