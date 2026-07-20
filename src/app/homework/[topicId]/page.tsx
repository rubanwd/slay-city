import { notFound } from "next/navigation";

import AuthGuard from "@/components/auth/AuthGuard";
import HomeworkTopicScreen from "@/features/homework/HomeworkTopicScreen";
import type { MissionTaskViewModel } from "@/features/mission/types";
import { createClient } from "@/lib/supabase/server";

interface HomeworkTopicPageProps {
  params: Promise<{ topicId: string }>;
}

export default async function HomeworkTopicPage({ params }: HomeworkTopicPageProps) {
  const { topicId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Unreachable in practice — middleware redirects unauthenticated requests —
    // but keeps the page well-typed without a non-null assertion.
    return null;
  }

  // RLS (`homework_topics_select`) already restricts this to a topic in one of
  // the child's own groups — a topic from another group simply comes back null.
  const [topicRes, tasksRes, completionsRes] = await Promise.all([
    supabase.from("homework_topics").select("id, title, description").eq("id", topicId).maybeSingle(),
    supabase
      .from("homework_tasks")
      .select("id, task_type, order_index, content")
      .eq("topic_id", topicId)
      .order("order_index"),
    supabase.from("homework_task_completions").select("task_id").eq("child_id", user.id),
  ]);

  const topic = topicRes.data;
  if (!topic) {
    notFound();
  }

  const tasks: MissionTaskViewModel[] = (tasksRes.data ?? []).map((task) => ({
    id: task.id,
    taskType: task.task_type,
    orderIndex: task.order_index,
    content: task.content,
  }));

  const taskIds = new Set(tasks.map((t) => t.id));
  const completedTaskIds = (completionsRes.data ?? [])
    .map((row) => row.task_id)
    .filter((id) => taskIds.has(id));

  return (
    <AuthGuard>
      <HomeworkTopicScreen
        topic={{ id: topic.id, title: topic.title, description: topic.description }}
        tasks={tasks}
        completedTaskIds={completedTaskIds}
      />
    </AuthGuard>
  );
}
