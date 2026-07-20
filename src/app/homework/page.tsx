import AuthGuard from "@/components/auth/AuthGuard";
import { getMyGroups } from "@/features/homework/queries";
import HomeworkScreen, { type HomeworkTopicSummary } from "@/features/homework/HomeworkScreen";
import { createClient } from "@/lib/supabase/server";

export default async function HomeworkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Unreachable in practice — middleware redirects unauthenticated requests —
    // but keeps the page well-typed without a non-null assertion.
    return null;
  }

  const groups = await getMyGroups(supabase);
  const groupNameById = new Map(groups.map((g) => [g.groupId, g.groupName]));

  if (groups.length === 0) {
    return (
      <AuthGuard>
        <HomeworkScreen topics={[]} />
      </AuthGuard>
    );
  }

  const { data: topicRows } = await supabase
    .from("homework_topics")
    .select("id, group_id, title, description, order_index")
    .in(
      "group_id",
      groups.map((g) => g.groupId)
    )
    .order("order_index");

  const topics = topicRows ?? [];
  const topicIds = topics.map((t) => t.id);

  const [tasksRes, completionsRes] = await Promise.all([
    topicIds.length > 0
      ? supabase.from("homework_tasks").select("id, topic_id").in("topic_id", topicIds)
      : Promise.resolve({ data: [] as { id: string; topic_id: string }[] }),
    supabase.from("homework_task_completions").select("task_id").eq("child_id", user.id),
  ]);

  const tasksByTopic = new Map<string, string[]>();
  for (const task of tasksRes.data ?? []) {
    const list = tasksByTopic.get(task.topic_id) ?? [];
    list.push(task.id);
    tasksByTopic.set(task.topic_id, list);
  }

  const completedTaskIds = new Set((completionsRes.data ?? []).map((row) => row.task_id));

  const topicSummaries: HomeworkTopicSummary[] = topics.map((topic) => {
    const taskIds = tasksByTopic.get(topic.id) ?? [];
    return {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      groupName: groupNameById.get(topic.group_id) ?? "Class",
      totalTasks: taskIds.length,
      completedTasks: taskIds.filter((id) => completedTaskIds.has(id)).length,
    };
  });

  return (
    <AuthGuard>
      <HomeworkScreen topics={topicSummaries} />
    </AuthGuard>
  );
}
