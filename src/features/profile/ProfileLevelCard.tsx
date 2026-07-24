"use client";

import { useState, useTransition } from "react";

import LevelPicker from "@/features/levels/LevelPicker";
import LockedLevelsNote from "@/features/levels/LockedLevelsNote";
import { changeMyLevel } from "@/features/levels/actions";
import { KNOWLEDGE_LEVEL_LABELS } from "@/features/levels/levels";
import type { KnowledgeLevel } from "@/types";

export interface ProfileLevelCardProps {
  /** The level the child is studying right now. */
  current: KnowledgeLevel;
  /** Levels with content — the only ones that can be switched to. */
  available: readonly KnowledgeLevel[];
}

/**
 * Lets a child change their knowledge level from their own profile. Picking a
 * level saves immediately and the map re-renders around the new level's
 * districts; mission progress is per-mission, so switching never loses
 * anything.
 *
 * The picker is collapsed by default — the card shows the current level and a
 * Change button, so the profile screen keeps a single obvious primary action.
 */
export default function ProfileLevelCard({ current, available }: ProfileLevelCardProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Shown while the server round-trips so the tapped card reads as selected.
  const [optimistic, setOptimistic] = useState<KnowledgeLevel>(current);

  const canChange = available.length > 1 || (available.length === 1 && available[0] !== current);

  function handleChange(level: KnowledgeLevel) {
    if (level === optimistic) {
      setOpen(false);
      return;
    }
    setOptimistic(level);
    setError(null);
    startTransition(async () => {
      const result = await changeMyLevel(level);
      if (!result.ok) {
        setOptimistic(current);
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-label uppercase tracking-widest text-white/50">Level</span>
          <span className="text-body-strong font-bold text-lime-green">
            {KNOWLEDGE_LEVEL_LABELS[optimistic]}
          </span>
        </span>

        {canChange && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            disabled={pending}
            className="shrink-0 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/60 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {open ? "Close" : "Change"}
          </button>
        )}
      </div>

      {open && (
        <LevelPicker
          levels={available}
          value={optimistic}
          onChange={handleChange}
          disabled={pending}
        />
      )}

      {!canChange && (
        <p className="text-small text-white/40">
          More levels unlock as new districts are added to the city.
        </p>
      )}
      {open && <LockedLevelsNote available={available} />}

      {pending && (
        <p className="text-small text-white/50" aria-live="polite">
          Switching level…
        </p>
      )}
      {error && (
        <p role="alert" className="text-small font-semibold text-neon-pink">
          {error}
        </p>
      )}
    </div>
  );
}
