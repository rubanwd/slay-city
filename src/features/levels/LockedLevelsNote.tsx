import { DEFAULT_LOCALE, getMessages, type Locale } from "@/features/i18n";
import type { KnowledgeLevel } from "@/types";

import { KNOWLEDGE_LEVELS, KNOWLEDGE_LEVEL_LABELS } from "./levels";

export interface LockedLevelsNoteProps {
  /** Levels that already have content — everything else is listed as locked. */
  available: readonly KnowledgeLevel[];
  /** Language for the "coming soon" line; the level names stay as authored. */
  locale?: Locale;
}

/**
 * Shows the rest of the level ladder as "coming soon" so a student can see where
 * they're headed, without offering a level that would open onto an empty map.
 * Renders nothing once every level has content.
 */
export default function LockedLevelsNote({
  available,
  locale = DEFAULT_LOCALE,
}: LockedLevelsNoteProps) {
  const locked = KNOWLEDGE_LEVELS.filter((level) => !available.includes(level));
  if (locked.length === 0) return null;

  return (
    <p className="text-small text-white/40">
      {getMessages(locale).student.profile.levelComingSoon(
        locked.map((level) => KNOWLEDGE_LEVEL_LABELS[level]).join(", ")
      )}
    </p>
  );
}
