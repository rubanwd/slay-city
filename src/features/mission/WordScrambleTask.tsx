"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";

import { SlayButton } from "@/components/ui";

import { shuffle } from "./taskUtils";
import type { WordScrambleContent } from "./types";
import { isSpelledCorrectly, scrambleWord, slotGroups } from "./wordPuzzle";

export interface WordScrambleTaskProps {
  content: WordScrambleContent;
  onComplete: () => void;
  actionLabel?: string;
}

interface Tile {
  id: number;
  char: string;
}

/**
 * The word's letters are shuffled into tiles. The student taps tiles to fill the
 * answer slots (tapping a placed tile sends it back), and the row turns green
 * once the spelling matches.
 *
 * The answer is drawn as one empty slot per letter, grouped into the words it is
 * made of, so a multi-word answer ("adventure tourist") shows its gap instead of
 * hiding a space among the tiles — see `wordPuzzle.ts`.
 */
export default function WordScrambleTask({
  content,
  onComplete,
  actionLabel = "Next",
}: WordScrambleTaskProps) {
  const { word, translation, hint, imageUrl } = content;

  const { letters, groupSizes } = useMemo(() => scrambleWord(word), [word]);

  const tiles = useMemo<Tile[]>(() => {
    const base = letters.map((char, id) => ({ id, char }));
    // Reshuffle until it isn't already in order (unless the word is a single letter).
    let scrambled = shuffle(base);
    for (let i = 0; i < 8 && scrambled.map((t) => t.char).join("") === letters.join(""); i++) {
      scrambled = shuffle(base);
    }
    return scrambled;
  }, [letters]);

  const [placed, setPlaced] = useState<number[]>([]);

  const placedSet = new Set(placed);
  const built = placed.map((id) => tiles.find((t) => t.id === id)!.char).join("");
  const solved = isSpelledCorrectly(built, word);
  const groups = useMemo(() => slotGroups(groupSizes), [groupSizes]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        {imageUrl && (
          <div className="h-32 w-32 overflow-hidden rounded-2xl bg-white/5">
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        {translation && <p className="text-lg font-semibold text-cyan">{translation}</p>}
        {hint && <p className="text-small text-white/60">Hint: {hint}</p>}
      </div>

      {/* Answer slots — one per letter, grouped word by word. */}
      <div className="flex min-h-[3.5rem] flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl border border-white/15 bg-black/30 p-3">
        {groups.map((slots, groupIndex) => (
          <div key={groupIndex} className="flex flex-wrap items-center justify-center gap-1.5">
            {slots.map((slot) => {
              const id = placed[slot];
              if (id === undefined) {
                return (
                  <span
                    key={slot}
                    aria-hidden="true"
                    className="h-11 w-9 rounded-lg border border-dashed border-white/20 bg-white/[0.02]"
                  />
                );
              }
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setPlaced((prev) => prev.filter((_, i) => i !== slot))}
                  disabled={solved}
                  aria-label={`Remove ${tiles.find((t) => t.id === id)!.char}`}
                  className={[
                    "flex h-11 w-9 items-center justify-center rounded-lg border text-body-strong font-black transition-colors",
                    solved
                      ? "border-lime-green bg-lime-green/15 text-lime-green"
                      : "border-cyan/60 bg-cyan/10 text-white",
                  ].join(" ")}
                >
                  {tiles.find((t) => t.id === id)!.char}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Letter pool */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {tiles.map((tile) => {
          const used = placedSet.has(tile.id);
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => setPlaced((prev) => [...prev, tile.id])}
              disabled={used || solved}
              aria-label={`Place ${tile.char}`}
              className={[
                "flex h-12 w-10 items-center justify-center rounded-xl border text-h3 font-black transition-colors",
                used
                  ? "border-white/10 bg-white/[0.03] text-white/20"
                  : "border-white/20 bg-white/10 text-white hover:border-white/40",
              ].join(" ")}
            >
              {tile.char}
            </button>
          );
        })}
      </div>

      {placed.length > 0 && !solved && (
        <button
          type="button"
          onClick={() => setPlaced([])}
          className="mx-auto text-xs font-bold uppercase tracking-wide text-white/50 hover:text-white"
        >
          Clear
        </button>
      )}

      {solved && <p className="text-center font-bold text-lime-green">Perfect! 🎉</p>}

      <SlayButton
        variant="green"
        size="lg"
        className="w-full"
        onClick={() => onComplete()}
        disabled={!solved}
      >
        {actionLabel}
      </SlayButton>
    </div>
  );
}
