import { redirect } from "next/navigation";

import CollapsibleSection from "@/features/teacher/CollapsibleSection";
import GrammarCompletions, {
  type GrammarCompletionRow,
} from "@/features/teacher/GrammarCompletions";
import GrammarManager from "@/features/teacher/GrammarManager";
import HomeworkTopicItem from "@/features/teacher/HomeworkTopicItem";
import TeacherHeader from "@/features/teacher/TeacherHeader";
import VocabularyCompletions, {
  type VocabularyCompletionRow,
} from "@/features/teacher/VocabularyCompletions";
import VocabularyManager from "@/features/teacher/VocabularyManager";
import type { GrammarDraftTask } from "@/features/homework/grammar";
import { requireTeacherPage } from "@/features/teacher/guard";

interface TopicTasksPageProps {
  params: Promise<{ groupId: string; topicId: string }>;
}

/**
 * Manage one homework topic: its info, plus the two learning modules a topic
 * can carry — Vocabulary and Grammar — each an AI-authored set of study cards
 * and a test, with a roster of who has passed.
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

  // Vocabulary + grammar sets for this topic, plus the group roster used to
  // cross-reference completions. `teacher_group_members` (with member usernames)
  // is the RLS-allowed path to child names.
  const [
    vocabWordsRes,
    vocabTasksRes,
    grammarPointsRes,
    grammarTasksRes,
    membersRes,
    vocabCompletionsRes,
    grammarCompletionsRes,
  ] = await Promise.all([
    supabase
      .from("homework_vocab_words")
      .select("word, transcription, translation, image_url, order_index")
      .eq("topic_id", topicId)
      .order("order_index"),
    supabase.from("homework_vocab_tasks").select("id").eq("topic_id", topicId),
    supabase
      .from("homework_grammar_points")
      .select("title, explanation, example, order_index")
      .eq("topic_id", topicId)
      .order("order_index"),
    supabase
      .from("homework_grammar_tasks")
      .select("task_type, content, order_index")
      .eq("topic_id", topicId)
      .order("order_index"),
    supabase
      .from("teacher_group_members")
      .select("child_id, profiles(username)")
      .eq("group_id", groupId),
    supabase.from("homework_vocab_completions").select("child_id").eq("topic_id", topicId),
    supabase.from("homework_grammar_completions").select("child_id").eq("topic_id", topicId),
  ]);

  const vocabWords = (vocabWordsRes.data ?? []).map((w) => ({
    word: w.word,
    transcription: w.transcription,
    translation: w.translation,
    imageUrl: w.image_url,
  }));

  const grammarPoints = (grammarPointsRes.data ?? []).map((p) => ({
    title: p.title,
    explanation: p.explanation,
    example: p.example,
  }));

  const grammarTasks: GrammarDraftTask[] = (grammarTasksRes.data ?? []).map((t) => ({
    taskType: t.task_type,
    content: t.content,
  }));

  const members = membersRes.data ?? [];

  const vocabPassed = new Set((vocabCompletionsRes.data ?? []).map((r) => r.child_id));
  const vocabRows: VocabularyCompletionRow[] = members.map((m) => ({
    childId: m.child_id,
    username: m.profiles?.username ?? "Unknown",
    passed: vocabPassed.has(m.child_id),
  }));

  const grammarPassed = new Set((grammarCompletionsRes.data ?? []).map((r) => r.child_id));
  const grammarRows: GrammarCompletionRow[] = members.map((m) => ({
    childId: m.child_id,
    username: m.profiles?.username ?? "Unknown",
    passed: grammarPassed.has(m.child_id),
  }));

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <TeacherHeader title={topic.title} backHref={`/teacher/groups/${groupId}`} />

        <CollapsibleSection
          title="Topic Info"
          subtitle="Title, description and extra info students see before starting."
        >
          <ul>
            <HomeworkTopicItem
              groupId={groupId}
              topic={topic}
              wordCount={vocabWords.length}
              grammarCount={grammarPoints.length}
              linkToTasks={false}
            />
          </ul>
        </CollapsibleSection>

        <CollapsibleSection
          title="Vocabulary Learning"
          subtitle="Words the group learns as flashcards, plus an auto-built test to check them."
        >
          <VocabularyManager
            topicId={topicId}
            topicTitle={topic.title}
            topicDescription={topic.description}
            initialWords={vocabWords}
            initialTaskCount={vocabTasksRes.data?.length ?? 0}
          />
          <VocabularyCompletions rows={vocabRows} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Grammar Learning"
          subtitle="Grammar rules the group studies as cards, plus an AI-built test to check them."
        >
          <GrammarManager
            topicId={topicId}
            topicTitle={topic.title}
            topicDescription={topic.description}
            initialPoints={grammarPoints}
            initialTasks={grammarTasks}
          />
          <GrammarCompletions rows={grammarRows} />
        </CollapsibleSection>
      </div>
    </main>
  );
}
