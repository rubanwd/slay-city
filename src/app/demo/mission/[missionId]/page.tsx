import { notFound, redirect } from "next/navigation";

import { DEMO_GATE_PATH } from "@/features/demo/demoProgress";
import DemoMissionScreen from "@/features/demo/DemoMissionScreen";
import { DEMO_LEVEL, readDemoProgress } from "@/features/demo/queries";
import type { MissionTaskViewModel } from "@/features/mission/types";
import { createClient } from "@/lib/supabase/server";

interface DemoMissionPageProps {
  params: Promise<{ missionId: string }>;
}

/**
 * The public mission player: the demo map's Start button leads here.
 *
 * Identical to the signed-in player except that nothing is recorded server-side
 * — see `DemoMissionScreen`. The mission must be one the demo map could have
 * offered (published, at a published location of a published {@link DEMO_LEVEL}
 * district), since the id comes straight from the URL.
 */
export default async function DemoMissionPage({ params }: DemoMissionPageProps) {
  const { missionId } = await params;
  const [supabase, progress] = await Promise.all([createClient(), readDemoProgress()]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A signed-in player belongs in the real player, where the mission counts.
  if (user) {
    redirect(`/mission/${missionId}`);
  }

  // The free location is already finished — nothing more to play until they
  // sign up (or restart the demo from the sign-up wall).
  if (progress.gated) {
    redirect(DEMO_GATE_PATH);
  }

  const [missionRes, tasksRes] = await Promise.all([
    supabase
      .from("missions")
      .select(
        "id, title, description, xp_reward, coin_reward, locations!inner(name, icon_url, is_published, districts!inner(is_published, level))"
      )
      .eq("id", missionId)
      .eq("is_published", true)
      .eq("locations.is_published", true)
      .eq("locations.districts.is_published", true)
      .eq("locations.districts.level", DEMO_LEVEL)
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

  // The FK relationship comes back as a single related row.
  const location = mission.locations as { name: string; icon_url: string | null };

  return (
    <DemoMissionScreen
      mission={{
        id: mission.id,
        title: mission.title,
        description: mission.description,
        xpReward: mission.xp_reward,
        coinReward: mission.coin_reward,
      }}
      location={{ name: location.name, iconUrl: location.icon_url }}
      tasks={tasks}
    />
  );
}
