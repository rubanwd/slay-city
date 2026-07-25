import { notFound } from "next/navigation";

import MissionScreen from "@/features/mission/MissionScreen";
import type { MissionTaskViewModel } from "@/features/mission/types";
import { requireTeacherPage } from "@/features/teacher/guard";

interface TeacherMissionPageProps {
  params: Promise<{ missionId: string }>;
}

/**
 * A mission played in review mode by a teacher: the same screen, tasks and
 * order a student gets, with nothing recorded — no completion, no XP or coins, no
 * reward screen (see `MissionScreen`'s `review` prop). Every published mission
 * is reachable regardless of order, since a teacher is checking the content
 * rather than progressing through it.
 */
export default async function TeacherMissionPage({ params }: TeacherMissionPageProps) {
  const { missionId } = await params;
  const { supabase } = await requireTeacherPage();

  const [missionRes, tasksRes] = await Promise.all([
    supabase
      .from("missions")
      .select("id, title, description, xp_reward, coin_reward, location_id, locations(name, icon_url)")
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

  // The rest of this location's missions, so a review can run straight on into
  // the next one instead of going back through the list every time.
  const { data: siblings } = await supabase
    .from("missions")
    .select("id, title, order_index")
    .eq("location_id", mission.location_id)
    .eq("is_published", true)
    .order("order_index");

  const ordered = siblings ?? [];
  const next = ordered[ordered.findIndex((row) => row.id === mission.id) + 1] ?? null;

  const tasks: MissionTaskViewModel[] = (tasksRes.data ?? []).map((task) => ({
    id: task.id,
    taskType: task.task_type,
    orderIndex: task.order_index,
    content: task.content,
  }));

  // The FK relationship comes back as a single related row (or null).
  const location = mission.locations as { name: string; icon_url: string | null } | null;

  return (
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
      review
      exitHref={`/teacher/location/${mission.location_id}`}
      nextMission={next ? { title: next.title, href: `/teacher/mission/${next.id}` } : null}
    />
  );
}
