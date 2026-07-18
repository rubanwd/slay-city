import { notFound, redirect } from "next/navigation";

import AuthGuard from "@/components/auth/AuthGuard";
import { taskTypeLabel } from "@/features/mission/types";
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

  const { data: tasks } = await supabase
    .from("mission_tasks")
    .select("task_type")
    .eq("mission_id", missionId)
    .eq("is_published", true)
    .order("order_index");

  const taskNames = (tasks ?? []).map((task) => taskTypeLabel(task.task_type));

  return (
    <AuthGuard>
      <RewardScreen
        coins={mission.coin_reward}
        xp={mission.xp_reward}
        missionTitle={mission.title}
        taskNames={taskNames}
        continueHref="/map"
      />
    </AuthGuard>
  );
}
