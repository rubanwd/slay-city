"use client";

import { useState } from "react";

import TopicChat from "@/features/homework/qa/TopicChat";
import UnreadBadge from "@/features/homework/qa/UnreadBadge";
import type { TopicMessage } from "@/features/homework/qa/queries";

import CollapsibleSection from "./CollapsibleSection";

export interface TopicQaSectionProps {
  topicId: string;
  groupName: string;
  /** The teacher's id — for right-aligning and deleting their own messages. */
  teacherId: string;
  initialMessages: TopicMessage[];
  /** Unread messages at page load; drives the header badge until the section is opened. */
  initialUnread: number;
}

/**
 * The teacher's Q&A section on a topic page: a collapsible thread shared with
 * the whole group, with an unread-message badge in its header that clears once
 * the teacher expands it (opening mounts `TopicChat`, which marks it read).
 */
export default function TopicQaSection({
  topicId,
  groupName,
  teacherId,
  initialMessages,
  initialUnread,
}: TopicQaSectionProps) {
  const [unread, setUnread] = useState(initialUnread);

  return (
    <CollapsibleSection
      title="Q&A"
      subtitle={`Shared thread — questions and answers are visible to everyone in ${groupName}.`}
      badge={<UnreadBadge count={unread} />}
      onOpen={() => setUnread(0)}
    >
      <TopicChat topicId={topicId} currentUserId={teacherId} initialMessages={initialMessages} />
    </CollapsibleSection>
  );
}
