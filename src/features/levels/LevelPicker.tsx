"use client";

import type { KnowledgeLevel } from "@/types";

import { KNOWLEDGE_LEVEL_DESCRIPTIONS, KNOWLEDGE_LEVEL_LABELS } from "./levels";

export interface LevelPickerProps {
  /** Levels with content, in learning order — see `getAvailableLevels`. */
  levels: readonly KnowledgeLevel[];
  /** Currently picked level; null before anything is picked. */
  value: KnowledgeLevel | null;
  onChange: (level: KnowledgeLevel) => void;
  /**
   * When set, the picked level is also submitted with the surrounding form
   * under this field name (used by the onboarding form).
   */
  name?: string;
  disabled?: boolean;
}

/**
 * Big tappable level cards — the level equivalent of picking a difficulty at
 * the start of a game. Used at onboarding and on the profile screen, so it
 * stays presentational: the caller owns the value and what a change means.
 *
 * Only levels that already have playable content are ever passed in; the rest
 * of the ladder is shown as a locked, non-interactive footnote by
 * {@link LockedLevelsNote}.
 */
export default function LevelPicker({
  levels,
  value,
  onChange,
  name,
  disabled = false,
}: LevelPickerProps) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Knowledge level">
      {name && <input type="hidden" name={name} value={value ?? ""} />}

      {levels.map((level) => {
        const selected = level === value;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(level)}
            className={[
              "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors",
              "disabled:pointer-events-none disabled:opacity-50",
              selected
                ? "border-lime-green bg-lime-green/10"
                : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10",
            ].join(" ")}
          >
            <span className="flex min-w-0 flex-col">
              <span
                className={`text-body-strong font-bold ${selected ? "text-lime-green" : "text-white"}`}
              >
                {KNOWLEDGE_LEVEL_LABELS[level]}
              </span>
              <span className="text-small text-white/50">
                {KNOWLEDGE_LEVEL_DESCRIPTIONS[level]}
              </span>
            </span>

            <span
              aria-hidden="true"
              className={[
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                selected ? "border-lime-green bg-lime-green" : "border-white/25",
              ].join(" ")}
            >
              {selected && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#111111"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
