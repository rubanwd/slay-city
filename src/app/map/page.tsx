import AuthGuard from "@/components/auth/AuthGuard";
import CityMap from "@/features/map/CityMap";
import {
  buildLocationProgress,
  buildMapViewModel,
  isLevelCompleted,
  selectActiveDistrict,
  sumLocationRewards,
} from "@/features/map/mapState";
import { hasAnyGroup } from "@/features/homework/queries";
import { studentNavLabels } from "@/features/i18n/navLabels";
import { resolveStudentLocale } from "@/features/i18n/server";
import { KNOWLEDGE_LEVEL_LABELS, nextKnowledgeLevel } from "@/features/levels/levels";
import { getMyLevel } from "@/features/levels/queries";
import { resolveMascotImage } from "@/features/wardrobe/mascot";
import { createClient } from "@/lib/supabase/server";

export default async function MapPage() {
  const [supabase, locale] = await Promise.all([createClient(), resolveStudentLocale()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Unreachable in practice — middleware already redirects unauthenticated
    // requests away from this route — but keeps this page well-typed without
    // a non-null assertion.
    return null;
  }

  // The map only ever shows the districts of the level the student is studying.
  // Switching level (profile screen) swaps the whole map; per-mission progress
  // is untouched, so coming back restores exactly what was finished there.
  const level = await getMyLevel(supabase, user.id);

  const [districtsRes, locationsRes, missionsRes, progressRes, statsRes, equippedRes, showHomework] =
    await Promise.all([
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

  // Every district of this level is done. The player is only ever still here
  // when no higher level had content to move them to (`complete_mission`
  // promotes them automatically when one does), so the map offers a replay.
  const nextLevel = nextKnowledgeLevel(level);
  const levelStatus = {
    completed: isLevelCompleted(mapDistricts),
    levelName: KNOWLEDGE_LEVEL_LABELS[level],
    nextLevelName: nextLevel ? KNOWLEDGE_LEVEL_LABELS[nextLevel] : null,
  };

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
        navLabels={studentNavLabels(locale)}
        levelStatus={levelStatus}
      />
    </AuthGuard>
  );
}
