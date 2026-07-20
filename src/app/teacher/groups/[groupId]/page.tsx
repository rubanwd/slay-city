import { redirect } from "next/navigation";

import AdminCreateModal from "@/features/admin/AdminCreateModal";
import HomeworkTopicForm from "@/features/teacher/HomeworkTopicForm";
import HomeworkTopicItem from "@/features/teacher/HomeworkTopicItem";
import TeacherHeader from "@/features/teacher/TeacherHeader";
import { requireTeacherPage } from "@/features/teacher/guard";

interface GroupHomeworkPageProps {
  params: Promise<{ groupId: string }>;
}

/** Manage a group's lesson topics (add, edit, delete). Each topic links to its own tasks page. */
export default async function GroupHomeworkPage({ params }: GroupHomeworkPageProps) {
  const { groupId } = await params;
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

  const { data: topics } = await supabase
    .from("homework_topics")
    .select("id, title, description, order_index, note_text, note_link_url, note_image_url")
    .eq("group_id", groupId)
    .order("order_index");

  const topicRows = topics ?? [];

  const { data: taskCounts } = await supabase
    .from("homework_tasks")
    .select("topic_id")
    .in(
      "topic_id",
      topicRows.map((t) => t.id)
    );

  const countByTopic = new Map<string, number>();
  for (const row of taskCounts ?? []) {
    countByTopic.set(row.topic_id, (countByTopic.get(row.topic_id) ?? 0) + 1);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <TeacherHeader title={group.name} backHref="/teacher" />

        <h2 className="mb-2 text-label text-white/50">Lesson Topics ({topicRows.length})</h2>
        {topicRows.length === 0 ? (
          <p className="mb-6 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No topics yet. Add the first one below.
          </p>
        ) : (
          <ul className="mb-6 flex flex-col gap-2">
            {topicRows.map((topic) => (
              <HomeworkTopicItem
                key={topic.id}
                groupId={groupId}
                topic={topic}
                taskCount={countByTopic.get(topic.id) ?? 0}
              />
            ))}
          </ul>
        )}

        <AdminCreateModal triggerLabel="Add Topic" title="Add Lesson Topic">
          <HomeworkTopicForm groupId={groupId} nextOrder={topicRows.length} />
        </AdminCreateModal>
      </div>
    </main>
  );
}
