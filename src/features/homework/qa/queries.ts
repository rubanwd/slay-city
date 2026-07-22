import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** One message in a topic's shared Q&A thread, with its author resolved. */
export interface TopicMessage {
  id: string;
  authorId: string;
  authorUsername: string;
  authorIsTeacher: boolean;
  body: string;
  createdAt: string;
}

/**
 * The Q&A thread for one topic, newest last. Backed by the
 * `get_topic_messages()` SECURITY DEFINER RPC — the only path to another
 * user's username, since neither a child nor a teacher has direct SELECT on
 * other people's `profiles` rows (see `20260722000001_homework_qa.sql`).
 */
export async function getTopicMessages(
  supabase: SupabaseServerClient,
  topicId: string
): Promise<TopicMessage[]> {
  const { data } = await supabase.rpc("get_topic_messages", { p_topic_id: topicId });
  return (data ?? []).map((row) => ({
    id: row.id,
    authorId: row.author_id,
    authorUsername: row.author_username,
    authorIsTeacher: row.author_is_teacher,
    body: row.body,
    createdAt: row.created_at,
  }));
}

/**
 * How many unread Q&A messages the signed-in user has per topic, across every
 * topic they can see. Keyed by topic id; absent topics have none. Backed by the
 * `get_unread_topics()` RPC — "unread" means a message from someone else newer
 * than the user's last read of that topic (see `20260722000003`).
 */
export async function getUnreadCounts(
  supabase: SupabaseServerClient
): Promise<Map<string, number>> {
  const { data } = await supabase.rpc("get_unread_topics");
  return new Map((data ?? []).map((row) => [row.topic_id, row.unread_count]));
}
