import AuthGuard from "@/components/auth/AuthGuard";
import CityMap from "@/features/map/CityMap";
import {
  buildLocationProgress,
  buildMapViewModel,
  selectActiveDistrict,
  sumLocationRewards,
} from "@/features/map/mapState";
import { hasAnyGroup } from "@/features/homework/queries";
import { resolveMascotImage } from "@/features/wardrobe/mascot";
import { createClient } from "@/lib/supabase/server";

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Unreachable in practice — middleware already redirects unauthenticated
    // requests away from this route — but keeps this page well-typed without
    // a non-null assertion.
    return null;
  }

  const [districtsRes, locationsRes, missionsRes, progressRes, statsRes, equippedRes, showHomework] =
    await Promise.all([
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
        .select("id, location_id, order_index, xp_reward, coin_reward")
        .eq("is_published", true)
        .order("order_index"),
      supabase.from("user_progress").select("mission_id, completed_at").eq("profile_id", user.id),
      supabase
        .from("user_stats")
        .select("xp, coins, level, current_streak")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase
        .from("user_wardrobe_items")
        .select("equipped_at, wardrobe_items(preview_url, image_url)")
        .eq("profile_id", user.id)
        .eq("equipped", true),
      hasAnyGroup(supabase),
    ]);

  const districts = districtsRes.data ?? [];
  const publishedDistrictIds = new Set(districts.map((d) => d.id));
  const locations = (locationsRes.data ?? []).filter((loc) =>
    publishedDistrictIds.has(loc.district_id)
  );

  const completedMissionIds = new Set(
    (progressRes.data ?? []).filter((row) => row.completed_at !== null).map((row) => row.mission_id)
  );

  const { completedLocationIds, nextMissionIdByLocation, missionCountsByLocation } =
    buildLocationProgress(missionsRes.data ?? [], completedMissionIds);

  const rewardsByLocation = sumLocationRewards(missionsRes.data ?? []);

  const mapDistricts = buildMapViewModel(
    districts,
    locations,
    completedLocationIds,
    nextMissionIdByLocation,
    rewardsByLocation,
    missionCountsByLocation
  );
  const activeDistrict = selectActiveDistrict(mapDistricts);

  const stats = statsRes.data;

  // The current-location marker wears the player's most recently equipped item;
  // falls back to the default snake when nothing with artwork is equipped.
  const mascotImageUrl = resolveMascotImage(
    (equippedRes.data ?? []).map((row) => {
      // The FK relationship comes back as a single related row (or null).
      const item = row.wardrobe_items as {
        preview_url: string | null;
        image_url: string | null;
      } | null;
      return {
        previewUrl: item?.preview_url ?? null,
        imageUrl: item?.image_url ?? null,
        equippedAt: row.equipped_at,
      };
    })
  );

  return (
    <AuthGuard>
      <CityMap
        district={activeDistrict}
        hud={{
          xp: stats?.xp ?? 0,
          coins: stats?.coins ?? 0,
          level: stats?.level ?? 1,
          currentStreak: stats?.current_streak ?? 0,
        }}
        mascotImageUrl={mascotImageUrl}
        showHomework={showHomework}
      />
    </AuthGuard>
  );
}
