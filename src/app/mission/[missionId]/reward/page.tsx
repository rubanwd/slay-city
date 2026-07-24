import { notFound, redirect } from "next/navigation";

import AuthGuard from "@/components/auth/AuthGuard";
import { taskTypeLabel } from "@/features/mission/types";
import { buildLocationProgress } from "@/features/map/mapState";
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
    .select("id, title, xp_reward, coin_reward, location_id, locations(id, name, district_id)")
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
    .select("id, xp_earned, coins_earned")
    .eq("profile_id", user.id)
    .eq("mission_id", missionId)
    .maybeSingle();

  if (!progress) {
    redirect("/map");
  }

  // Show what was actually granted (which can be a partial share when the player
  // finished a game early), falling back to the mission's full reward for older
  // completions recorded before per-completion amounts were tracked.
  const xpEarned = progress.xp_earned ?? mission.xp_reward;
  const coinsEarned = progress.coins_earned ?? mission.coin_reward;

  const { data: tasks } = await supabase
    .from("mission_tasks")
    .select("task_type")
    .eq("mission_id", missionId)
    .eq("is_published", true)
    .order("order_index");

  const taskNames = (tasks ?? []).map((task) => taskTypeLabel(task.task_type));

  // The FK relationship comes back as a single related row (or null).
  const location = mission.locations as { id: string; name: string; district_id: string } | null;

  // Work out where this completion leaves the player: how many missions are
  // left at this location, and whether finishing it also cleared the whole
  // district — the two moments the reward screen needs to explain clearly
  // instead of silently dropping the player back on the map.
  let missionsCompletedAtLocation = 0;
  let totalMissionsAtLocation = 0;
  let milestone: "location" | "district" | null = null;

  if (location) {
    const { data: districtLocations } = await supabase
      .from("locations")
      .select("id")
      .eq("district_id", location.district_id)
      .eq("is_published", true);

    const districtLocationIds = (districtLocations ?? []).map((loc) => loc.id);

    const [districtMissionsRes, progressRes] = await Promise.all([
      supabase
        .from("missions")
        .select("id, location_id, order_index")
        .in("location_id", districtLocationIds)
        .eq("is_published", true),
      supabase.from("user_progress").select("mission_id, completed_at").eq("profile_id", user.id),
    ]);

    const completedMissionIds = new Set(
      (progressRes.data ?? [])
        .filter((row) => row.completed_at !== null)
        .map((row) => row.mission_id)
    );

    const { completedLocationIds, missionCountsByLocation } = buildLocationProgress(
      districtMissionsRes.data ?? [],
      completedMissionIds
    );

    const counts = missionCountsByLocation.get(location.id);
    missionsCompletedAtLocation = counts?.completed ?? 0;
    totalMissionsAtLocation = counts?.total ?? 0;

    const isLocationComplete = completedLocationIds.has(location.id);
    const isDistrictComplete =
      districtLocationIds.length > 0 &&
      districtLocationIds.every((id) => completedLocationIds.has(id));

    if (isDistrictComplete) {
      milestone = "district";
    } else if (isLocationComplete) {
      milestone = "location";
    }
  }

  const continueParams = new URLSearchParams();
  if (location) continueParams.set("focus", location.id);
  if (milestone) continueParams.set("milestone", milestone);
  if (milestone === "location" && location) continueParams.set("name", location.name);
  const continueHref = continueParams.size > 0 ? `/map?${continueParams.toString()}` : "/map";

  return (
    <AuthGuard>
      <RewardScreen
        coins={coinsEarned}
        xp={xpEarned}
        missionTitle={mission.title}
        taskNames={taskNames}
        continueHref={continueHref}
        locationName={location?.name ?? null}
        missionsCompletedAtLocation={missionsCompletedAtLocation}
        totalMissionsAtLocation={totalMissionsAtLocation}
        milestone={milestone}
      />
    </AuthGuard>
  );
}
