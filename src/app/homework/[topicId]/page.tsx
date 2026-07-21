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
  const [
    topicRes,
    vocabWordsRes,
    vocabTasksRes,
    vocabPassRes,
    grammarPointsRes,
    grammarTasksRes,
    grammarPassRes,
  ] = await Promise.all([
    supabase
      .from("homework_topics")
      .select("id, title, description, note_text, note_link_url, note_image_url")
      .eq("id", topicId)
      .maybeSingle(),
    supabase
      .from("homework_vocab_words")
      .select("id, word, transcription, translation, image_url, order_index")
      .eq("topic_id", topicId)
      .order("order_index"),
    supabase
      .from("homework_vocab_tasks")
      .select("id, task_type, order_index, content")
      .eq("topic_id", topicId)
      .order("order_index"),
    supabase
      .from("homework_vocab_completions")
      .select("id")
      .eq("topic_id", topicId)
      .eq("child_id", user.id)
      .maybeSingle(),
    supabase
      .from("homework_grammar_points")
      .select("id, title, explanation, example, order_index")
      .eq("topic_id", topicId)
      .order("order_index"),
    supabase
      .from("homework_grammar_tasks")
      .select("id, task_type, order_index, content")
      .eq("topic_id", topicId)
      .order("order_index"),
    supabase
      .from("homework_grammar_completions")
      .select("id")
      .eq("topic_id", topicId)
      .eq("child_id", user.id)
      .maybeSingle(),
  ]);

  const topic = topicRes.data;
  if (!topic) {
    notFound();
  }

  const vocabWords = (vocabWordsRes.data ?? []).map((w) => ({
    id: w.id,
    word: w.word,
    transcription: w.transcription,
    translation: w.translation,
    imageUrl: w.image_url,
    orderIndex: w.order_index,
  }));

  const vocabTasks: MissionTaskViewModel[] = (vocabTasksRes.data ?? []).map((task) => ({
    id: task.id,
    taskType: task.task_type,
    orderIndex: task.order_index,
    content: task.content,
  }));

  const grammarPoints = (grammarPointsRes.data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    explanation: p.explanation,
    example: p.example,
    orderIndex: p.order_index,
  }));

  const grammarTasks: MissionTaskViewModel[] = (grammarTasksRes.data ?? []).map((task) => ({
    id: task.id,
    taskType: task.task_type,
    orderIndex: task.order_index,
    content: task.content,
  }));

  return (
    <AuthGuard>
      <HomeworkTopicScreen
        topic={{ id: topic.id, title: topic.title, description: topic.description }}
        note={{
          text: topic.note_text,
          linkUrl: topic.note_link_url,
          imageUrl: topic.note_image_url,
        }}
        vocab={
          vocabWords.length > 0
            ? { words: vocabWords, tasks: vocabTasks, passed: Boolean(vocabPassRes.data) }
            : undefined
        }
        grammar={
          grammarPoints.length > 0
            ? { points: grammarPoints, tasks: grammarTasks, passed: Boolean(grammarPassRes.data) }
            : undefined
        }
      />
    </AuthGuard>
  );
}
