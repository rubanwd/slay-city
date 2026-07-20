import { redirect } from "next/navigation";

import AdminCreateModal from "@/features/admin/AdminCreateModal";
import HomeworkTaskForm from "@/features/teacher/HomeworkTaskForm";
import HomeworkTaskItem from "@/features/teacher/HomeworkTaskItem";
import TeacherHeader from "@/features/teacher/TeacherHeader";
import { requireTeacherPage } from "@/features/teacher/guard";

interface TopicTasksPageProps {
  params: Promise<{ groupId: string; topicId: string }>;
}

/**
 * Manage the tasks that make up one homework topic (add, edit, delete). Task
 * types and their content editors are identical to the admin mission-task
 * form — every published task type is offered here too.
 */
export default async function TopicTasksPage({ params }: TopicTasksPageProps) {
  const { groupId, topicId } = await params;
  const { supabase, user } = await requireTeacherPage();

  const { data: group } = await supabase
    .from("teacher_groups")
    .select("id, name")
    .eq("id", groupId)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!group) {
    redirect("/teacher");
  }

  const { data: topic } = await supabase
    .from("homework_topics")
    .select("id, title, group_id")
    .eq("id", topicId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (!topic) {
    redirect(`/teacher/groups/${groupId}`);
  }

  const { data: tasks } = await supabase
    .from("homework_tasks")
    .select("id, task_type, order_index, content")
    .eq("topic_id", topicId)
    .order("order_index");

  const rows = tasks ?? [];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <TeacherHeader title={topic.title} backHref={`/teacher/groups/${groupId}`} />

        <h2 className="mb-2 text-label text-white/50">Tasks ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="mb-6 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No tasks yet. Add the first one below.
          </p>
        ) : (
          <ul className="mb-6 flex flex-col gap-2">
            {rows.map((task) => (
              <HomeworkTaskItem key={task.id} topicId={topicId} groupId={groupId} task={task} />
            ))}
          </ul>
        )}

        <AdminCreateModal triggerLabel="Add Task" title="Add Homework Task">
          <HomeworkTaskForm topicId={topicId} groupId={groupId} nextOrder={rows.length} />
        </AdminCreateModal>
      </div>
    </main>
  );
}
