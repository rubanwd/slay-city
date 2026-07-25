import AuthGuard from "@/components/auth/AuthGuard";
import { getMyGroups } from "@/features/homework/queries";
import { getUnreadCounts } from "@/features/homework/qa/queries";
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
  const groupNames = groups.map((g) => g.groupName);
  const teacherByGroup = new Map(groups.map((g) => [g.groupId, g.teacherUsername]));

  if (groups.length === 0) {
    return (
      <AuthGuard>
        <HomeworkScreen groupNames={[]} topics={[]} />
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

  // A topic offers up to two learning modules (vocabulary, grammar); progress
  // is how many of the present modules the student has passed.
  const [vocabWordsRes, grammarPointsRes, vocabPassRes, grammarPassRes] = await Promise.all([
    topicIds.length > 0
      ? supabase.from("homework_vocab_words").select("topic_id").in("topic_id", topicIds)
      : Promise.resolve({ data: [] as { topic_id: string }[] }),
    topicIds.length > 0
      ? supabase.from("homework_grammar_points").select("topic_id").in("topic_id", topicIds)
      : Promise.resolve({ data: [] as { topic_id: string }[] }),
    supabase.from("homework_vocab_completions").select("topic_id").eq("student_id", user.id),
    supabase.from("homework_grammar_completions").select("topic_id").eq("student_id", user.id),
  ]);

  const topicsWithVocab = new Set((vocabWordsRes.data ?? []).map((r) => r.topic_id));
  const topicsWithGrammar = new Set((grammarPointsRes.data ?? []).map((r) => r.topic_id));
  const vocabPassed = new Set((vocabPassRes.data ?? []).map((r) => r.topic_id));
  const grammarPassed = new Set((grammarPassRes.data ?? []).map((r) => r.topic_id));
  const unreadByTopic = await getUnreadCounts(supabase);

  const topicSummaries: HomeworkTopicSummary[] = topics.map((topic) => {
    const hasVocab = topicsWithVocab.has(topic.id);
    const hasGrammar = topicsWithGrammar.has(topic.id);
    const totalModules = (hasVocab ? 1 : 0) + (hasGrammar ? 1 : 0);
    const passedModules =
      (hasVocab && vocabPassed.has(topic.id) ? 1 : 0) +
      (hasGrammar && grammarPassed.has(topic.id) ? 1 : 0);
    return {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      teacherUsername: teacherByGroup.get(topic.group_id) ?? "your teacher",
      totalModules,
      passedModules,
      unreadCount: unreadByTopic.get(topic.id) ?? 0,
    };
  });

  return (
    <AuthGuard>
      <HomeworkScreen groupNames={groupNames} topics={topicSummaries} />
    </AuthGuard>
  );
}
