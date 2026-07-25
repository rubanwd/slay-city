import type { createClient } from "@/lib/supabase/server";
import { getParentProgressSummary } from "@/features/parent/queries";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** One topic's pass state for a given student. */
export interface TeacherTopicResult {
  topicId: string;
  title: string;
  /** True when the student has passed every module (vocabulary/grammar) the topic has. */
  passed: boolean;
}

export interface TeacherGroupStudent {
  id: string;
  username: string;
  /** Total missions the student has completed across the map. */
  missionsCompleted: number;
  /** Per-topic pass results for this group's homework topics (only topics with content). */
  topicResults: TeacherTopicResult[];
}

export interface TeacherGroup {
  id: string;
  name: string;
  students: TeacherGroupStudent[];
}

/**
 * Read-only groups + students for the teacher dashboard. Each student shows their
 * total completed missions plus, per homework topic in the group, whether they
 * have passed it — a topic counts as passed once every learning module it has
 * (vocabulary and/or grammar) is completed by that student. Topics with no
 * content yet are omitted, since there is nothing to pass.
 */
export async function getTeacherGroups(
  supabase: SupabaseServerClient,
  teacherId: string
): Promise<TeacherGroup[]> {
  const { data: groups } = await supabase
    .from("teacher_groups")
    .select("id, name, created_at")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: true });

  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map((group) => group.id);

  const [{ data: members }, { data: topics }] = await Promise.all([
    supabase
      .from("teacher_group_members")
      .select("group_id, student_id, profiles(username)")
      .in("group_id", groupIds),
    supabase
      .from("homework_topics")
      .select("id, group_id, title, order_index")
      .in("group_id", groupIds)
      .order("order_index", { ascending: true }),
  ]);

  const topicRows = topics ?? [];
  const topicIds = topicRows.map((t) => t.id);

  // Which modules each topic has, and every student's passes across all topics.
  const [vocabWordsRes, grammarPointsRes, vocabComplRes, grammarComplRes] =
    topicIds.length > 0
      ? await Promise.all([
          supabase.from("homework_vocab_words").select("topic_id").in("topic_id", topicIds),
          supabase.from("homework_grammar_points").select("topic_id").in("topic_id", topicIds),
          supabase
            .from("homework_vocab_completions")
            .select("topic_id, student_id")
            .in("topic_id", topicIds),
          supabase
            .from("homework_grammar_completions")
            .select("topic_id, student_id")
            .in("topic_id", topicIds),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const topicsWithVocab = new Set((vocabWordsRes.data ?? []).map((r) => r.topic_id));
  const topicsWithGrammar = new Set((grammarPointsRes.data ?? []).map((r) => r.topic_id));
  const vocabPass = new Set((vocabComplRes.data ?? []).map((r) => `${r.topic_id}:${r.student_id}`));
  const grammarPass = new Set(
    (grammarComplRes.data ?? []).map((r) => `${r.topic_id}:${r.student_id}`)
  );

  // Topics that actually have something to pass, grouped by their group.
  const topicsByGroup = new Map<string, { id: string; title: string }[]>();
  for (const t of topicRows) {
    if (!topicsWithVocab.has(t.id) && !topicsWithGrammar.has(t.id)) continue;
    const list = topicsByGroup.get(t.group_id) ?? [];
    list.push({ id: t.id, title: t.title });
    topicsByGroup.set(t.group_id, list);
  }

  const membersByGroup = new Map<string, { studentId: string; username: string }[]>();
  for (const row of members ?? []) {
    const list = membersByGroup.get(row.group_id) ?? [];
    list.push({ studentId: row.student_id, username: row.profiles?.username ?? "Unknown" });
    membersByGroup.set(row.group_id, list);
  }

  function topicResultsFor(groupId: string, studentId: string): TeacherTopicResult[] {
    return (topicsByGroup.get(groupId) ?? []).map((topic) => {
      const key = `${topic.id}:${studentId}`;
      const needsVocab = topicsWithVocab.has(topic.id);
      const needsGrammar = topicsWithGrammar.has(topic.id);
      const passed =
        (!needsVocab || vocabPass.has(key)) && (!needsGrammar || grammarPass.has(key));
      return { topicId: topic.id, title: topic.title, passed };
    });
  }

  return Promise.all(
    groups.map(async (group) => {
      const groupMembers = membersByGroup.get(group.id) ?? [];
      const students = await Promise.all(
        groupMembers.map(async (member) => {
          const progress = await getParentProgressSummary(supabase, member.studentId);
          return {
            id: member.studentId,
            username: member.username,
            missionsCompleted: progress.missionsCompleted,
            topicResults: topicResultsFor(group.id, member.studentId),
          };
        })
      );
      return { id: group.id, name: group.name, students };
    })
  );
}

