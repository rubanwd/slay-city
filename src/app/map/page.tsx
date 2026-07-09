import AuthGuard from "@/components/auth/AuthGuard";
import CityMap from "@/features/map/CityMap";
import { buildLocationProgress, buildMapViewModel } from "@/features/map/mapState";
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

  const [districtsRes, locationsRes, missionsRes, progressRes, statsRes] = await Promise.all([
    supabase
      .from("districts")
      .select("id, name, order_index")
      .eq("is_published", true)
      .order("order_index"),
    supabase
      .from("locations")
      .select("id, district_id, name, description, order_index, map_x, map_y")
      .eq("is_published", true)
      .order("order_index"),
    supabase
      .from("missions")
      .select("id, location_id, order_index")
      .eq("is_published", true)
      .order("order_index"),
    supabase.from("user_progress").select("mission_id, completed_at").eq("profile_id", user.id),
    supabase
      .from("user_stats")
      .select("xp, coins, level, current_streak")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  const districts = districtsRes.data ?? [];
  const publishedDistrictIds = new Set(districts.map((d) => d.id));
  const locations = (locationsRes.data ?? []).filter((loc) =>
    publishedDistrictIds.has(loc.district_id)
  );

  const completedMissionIds = new Set(
    (progressRes.data ?? [])
      .filter((row) => row.completed_at !== null)
      .map((row) => row.mission_id)
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

  const stats = statsRes.data;

  return (
    <AuthGuard>
      <CityMap
        districts={mapDistricts}
        hud={{
          xp: stats?.xp ?? 0,
          coins: stats?.coins ?? 0,
          level: stats?.level ?? 1,
          currentStreak: stats?.current_streak ?? 0,
        }}
      />
    </AuthGuard>
  );
}
