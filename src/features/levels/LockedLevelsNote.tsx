import type { KnowledgeLevel } from "@/types";

import { KNOWLEDGE_LEVELS, KNOWLEDGE_LEVEL_LABELS } from "./levels";

export interface LockedLevelsNoteProps {
  /** Levels that already have content — everything else is listed as locked. */
  available: readonly KnowledgeLevel[];
}

/**
 * Shows the rest of the level ladder as "coming soon" so a child can see where
 * they're headed, without offering a level that would open onto an empty map.
 * Renders nothing once every level has content.
 */
export default function LockedLevelsNote({ available }: LockedLevelsNoteProps) {
  const locked = KNOWLEDGE_LEVELS.filter((level) => !available.includes(level));
  if (locked.length === 0) return null;

  return (
    <p className="text-small text-white/40">
      Coming soon: {locked.map((level) => KNOWLEDGE_LEVEL_LABELS[level]).join(", ")}.
    </p>
  );
}
