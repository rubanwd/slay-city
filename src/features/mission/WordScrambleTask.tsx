"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";

import { SlayButton } from "@/components/ui";

import { shuffle } from "./taskUtils";
import type { WordScrambleContent } from "./types";

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
 * The word's letters are shuffled into tiles. The child taps tiles to spell the
 * word into the answer row (tapping a placed tile sends it back), and the row
 * turns green once the spelling matches.
 */
export default function WordScrambleTask({
  content,
  onComplete,
  actionLabel = "Next",
}: WordScrambleTaskProps) {
  const { word, translation, hint, imageUrl } = content;

  const tiles = useMemo<Tile[]>(() => {
    const base = word.split("").map((char, id) => ({ id, char }));
    // Reshuffle until it isn't already in order (unless the word is a single letter).
    let scrambled = shuffle(base);
    for (let i = 0; i < 8 && scrambled.map((t) => t.char).join("") === word; i++) {
      scrambled = shuffle(base);
    }
    return scrambled;
  }, [word]);

  const [placed, setPlaced] = useState<number[]>([]);

  const placedSet = new Set(placed);
  const built = placed.map((id) => tiles.find((t) => t.id === id)!.char).join("");
  const solved = built === word;

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

      {/* Answer row */}
      <div className="flex min-h-[3.5rem] flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-black/30 p-3">
        {placed.length === 0 ? (
          <span className="text-white/40">Tap the letters below…</span>
        ) : (
          placed.map((id, index) => (
            <button
              key={id}
              type="button"
              onClick={() => setPlaced((prev) => prev.filter((_, i) => i !== index))}
              disabled={solved}
              className={[
                "flex h-11 w-9 items-center justify-center rounded-lg border text-body-strong font-black transition-colors",
                solved
                  ? "border-lime-green bg-lime-green/15 text-lime-green"
                  : "border-cyan/60 bg-cyan/10 text-white",
              ].join(" ")}
            >
              {tiles.find((t) => t.id === id)!.char}
            </button>
          ))
        )}
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
        onClick={onComplete}
        disabled={!solved}
      >
        {actionLabel}
      </SlayButton>
    </div>
  );
}
