import { notFound } from "next/navigation";

import AuthGuard from "@/components/auth/AuthGuard";
import MissionScreen from "@/features/mission/MissionScreen";
import type { MissionTaskViewModel } from "@/features/mission/types";
import { createClient } from "@/lib/supabase/server";

interface MissionDetailPageProps {
  params: Promise<{ missionId: string }>;
}

export default async function MissionDetailPage({ params }: MissionDetailPageProps) {
  const { missionId } = await params;
  const supabase = await createClient();

  const [missionRes, tasksRes] = await Promise.all([
    supabase
      .from("missions")
      .select("id, title, description, xp_reward, coin_reward, locations(name, icon_url)")
      .eq("id", missionId)
      .eq("is_published", true)
      .maybeSingle(),
    supabase
      .from("mission_tasks")
      .select("id, task_type, order_index, content")
      .eq("mission_id", missionId)
      .eq("is_published", true)
      .order("order_index"),
  ]);

  const mission = missionRes.data;
  if (!mission) {
    notFound();
  }

  const tasks: MissionTaskViewModel[] = (tasksRes.data ?? []).map((task) => ({
    id: task.id,
    taskType: task.task_type,
    orderIndex: task.order_index,
    content: task.content,
  }));

  // The FK relationship comes back as a single related row (or null).
  const location = mission.locations as { name: string; icon_url: string | null } | null;

  return (
    <AuthGuard>
      <MissionScreen
        mission={{
          id: mission.id,
          title: mission.title,
          description: mission.description,
          xpReward: mission.xp_reward,
          coinReward: mission.coin_reward,
        }}
        location={location ? { name: location.name, iconUrl: location.icon_url } : null}
        tasks={tasks}
      />
    </AuthGuard>
  );
}
