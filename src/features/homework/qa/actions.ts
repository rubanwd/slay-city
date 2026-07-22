"use server";

import { createClient } from "@/lib/supabase/server";

/** Longest a single Q&A message may be — matches the textarea's guidance. */
const MAX_BODY_LENGTH = 2000;

export type PostMessageResult = { ok: true } | { ok: false; error: string };

/**
 * Post a message to a topic's shared Q&A thread, as the signed-in user. RLS
 * (`hw_messages_insert`) enforces both that `author_id` is the caller and that
 * the caller can see the topic, so no group/teacher check is needed here.
 * Delivery to other viewers is handled by Realtime, not revalidation.
 */
export async function postTopicMessage(
  topicId: string,
  body: string
): Promise<PostMessageResult> {
  const trimmed = body.trim();
  if (!topicId) return { ok: false, error: "Missing topic." };
  if (!trimmed) return { ok: false, error: "Message can't be empty." };
  if (trimmed.length > MAX_BODY_LENGTH) {
    return { ok: false, error: `Message must be ${MAX_BODY_LENGTH} characters or fewer.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { error } = await supabase
    .from("homework_topic_messages")
    .insert({ topic_id: topicId, author_id: user.id, body: trimmed });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Mark a topic's Q&A thread read up to now for the signed-in user, clearing its
 * unread badge. Fire-and-forget from the client when the thread is opened; RLS
 * (`hw_reads_*_own`) pins the row to the caller.
 */
export async function markTopicRead(topicId: string): Promise<void> {
  if (!topicId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("homework_topic_reads")
    .upsert(
      { topic_id: topicId, user_id: user.id, last_read_at: new Date().toISOString() },
      { onConflict: "topic_id,user_id" }
    );
}

/** Delete a message. RLS (`hw_messages_delete`) allows the author, the owning teacher, or an admin. */
export async function deleteTopicMessage(messageId: string): Promise<PostMessageResult> {
  if (!messageId) return { ok: false, error: "Missing message." };

  const supabase = await createClient();
  const { error } = await supabase.from("homework_topic_messages").delete().eq("id", messageId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
