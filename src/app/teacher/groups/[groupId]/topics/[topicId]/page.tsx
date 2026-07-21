import { redirect } from "next/navigation";

import AdminCreateModal from "@/features/admin/AdminCreateModal";
import HomeworkTaskForm from "@/features/teacher/HomeworkTaskForm";
import HomeworkTaskItem from "@/features/teacher/HomeworkTaskItem";
import HomeworkTopicItem from "@/features/teacher/HomeworkTopicItem";
import TeacherHeader from "@/features/teacher/TeacherHeader";
import VocabularyCompletions, {
  type VocabularyCompletionRow,
} from "@/features/teacher/VocabularyCompletions";
import VocabularyManager from "@/features/teacher/VocabularyManager";
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
  const { supabase, teacherId } = await requireTeacherPage();

  const { data: group } = await supabase
    .from("teacher_groups")
    .select("id, name")
    .eq("id", groupId)
    .eq("teacher_id", teacherId)
    .maybeSingle();

  if (!group) {
    redirect("/teacher");
  }

  const { data: topic } = await supabase
    .from("homework_topics")
    .select("id, title, group_id, description, order_index, note_text, note_link_url, note_image_url")
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

  // Vocabulary set for this topic: words, the size of its test, and who has
  // passed. `teacher_group_members` (with member usernames) is the RLS-allowed
  // path to child names; completions are cross-referenced against it.
  const [vocabWordsRes, vocabTasksRes, membersRes, vocabCompletionsRes] = await Promise.all([
    supabase
      .from("homework_vocab_words")
      .select("word, transcription, translation, image_url, order_index")
      .eq("topic_id", topicId)
      .order("order_index"),
    supabase.from("homework_vocab_tasks").select("id").eq("topic_id", topicId),
    supabase
      .from("teacher_group_members")
      .select("child_id, profiles(username)")
      .eq("group_id", groupId),
    supabase.from("homework_vocab_completions").select("child_id").eq("topic_id", topicId),
  ]);

  const vocabWords = (vocabWordsRes.data ?? []).map((w) => ({
    word: w.word,
    transcription: w.transcription,
    translation: w.translation,
    imageUrl: w.image_url,
  }));

  const passedChildIds = new Set((vocabCompletionsRes.data ?? []).map((r) => r.child_id));
  const completionRows: VocabularyCompletionRow[] = (membersRes.data ?? []).map((m) => ({
    childId: m.child_id,
    username: m.profiles?.username ?? "Unknown",
    passed: passedChildIds.has(m.child_id),
  }));

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <TeacherHeader title={topic.title} backHref={`/teacher/groups/${groupId}`} />

        <h2 className="mb-2 text-label text-white/50">Topic Info</h2>
        <ul className="mb-6">
          <HomeworkTopicItem
            groupId={groupId}
            topic={topic}
            taskCount={rows.length}
            linkToTasks={false}
          />
        </ul>

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

        <div className="mt-8">
          <VocabularyManager
            topicId={topicId}
            topicTitle={topic.title}
            topicDescription={topic.description}
            initialWords={vocabWords}
            initialTaskCount={vocabTasksRes.data?.length ?? 0}
          />
          <VocabularyCompletions rows={completionRows} />
        </div>
      </div>
    </main>
  );
}
