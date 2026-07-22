"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { SlayButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

import { deleteTopicMessage, postTopicMessage } from "./actions";
import type { TopicMessage } from "./queries";

export interface TopicChatProps {
  topicId: string;
  /** The signed-in user's id — used to right-align and allow deleting own messages. */
  currentUserId: string;
  /** Server-rendered thread, kept fresh afterwards via Realtime. */
  initialMessages: TopicMessage[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * A topic's shared Q&A thread — one live conversation between a group's
 * students and their teacher, scoped to a single topic. Seeded with the
 * server-rendered messages, then kept in sync via a Supabase Realtime
 * subscription: any insert/delete on this topic's messages triggers a refetch
 * through the `get_topic_messages` RPC (the only source of author usernames).
 */
export default function TopicChat({ topicId, currentUserId, initialMessages }: TopicChatProps) {
  const [messages, setMessages] = useState<TopicMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, startSend] = useTransition();

  const supabaseRef = useRef(createClient());
  const listRef = useRef<HTMLDivElement>(null);

  const refetch = useCallback(async () => {
    const { data } = await supabaseRef.current.rpc("get_topic_messages", {
      p_topic_id: topicId,
    });
    if (!data) return;
    setMessages(
      data.map((row) => ({
        id: row.id,
        authorId: row.author_id,
        authorUsername: row.author_username,
        authorIsTeacher: row.author_is_teacher,
        body: row.body,
        createdAt: row.created_at,
      }))
    );
  }, [topicId]);

  // Live sync: refetch the whole (short) thread on any change to this topic's
  // messages. RLS on the table gates which events we're allowed to receive.
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`topic-qa-${topicId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "homework_topic_messages",
          filter: `topic_id=eq.${topicId}`,
        },
        () => {
          void refetch();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [topicId, refetch]);

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    setError(null);
    startSend(async () => {
      const result = await postTopicMessage(topicId, body);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft("");
      await refetch();
    });
  };

  const remove = (id: string) => {
    startSend(async () => {
      const result = await deleteTopicMessage(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await refetch();
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] p-3">
      <div
        ref={listRef}
        className="flex max-h-72 min-h-24 flex-col gap-2 overflow-y-auto px-1 py-1"
      >
        {messages.length === 0 ? (
          <p className="my-auto text-center text-small text-white/40">
            No messages yet. Ask a question or leave a note — everyone in the group will see it.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.authorId === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-[11px] font-bold text-white/50">
                    {mine ? "You" : m.authorUsername}
                  </span>
                  {m.authorIsTeacher && (
                    <span className="rounded-full bg-neon-pink/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neon-pink">
                      Teacher
                    </span>
                  )}
                  <span className="text-[10px] text-white/30">{formatTime(m.createdAt)}</span>
                </div>
                <div
                  className={`group relative max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-small ${
                    mine
                      ? "bg-cyan/15 text-white"
                      : m.authorIsTeacher
                        ? "bg-neon-pink/10 text-white"
                        : "bg-white/5 text-white/80"
                  }`}
                >
                  {m.body}
                  {mine && (
                    <button
                      type="button"
                      onClick={() => remove(m.id)}
                      aria-label="Delete message"
                      className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-black text-xs text-white/60 transition-colors hover:text-neon-pink group-hover:flex"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="px-1 text-small text-neon-pink">{error}</p>}

      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Write a message…"
          className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-small text-white placeholder-white/40 caret-neon-pink transition-colors focus:border-neon-pink focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-neon-pink/60"
        />
        <SlayButton
          type="button"
          variant="green"
          size="sm"
          loading={isSending}
          disabled={!draft.trim()}
          onClick={send}
        >
          Send
        </SlayButton>
      </div>
    </div>
  );
}
