"use client";

import { useMemo, useState } from "react";

import { SlayButton } from "@/components/ui";

import type { SpotTheDifferenceContent } from "./types";

export interface SpotTheDifferenceTaskProps {
  content: SpotTheDifferenceContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * A grid of identical emoji hides one impostor. The student scans the grid and
 * taps it; a wrong tap just flashes so they can keep looking.
 */
export default function SpotTheDifferenceTask({
  content,
  onComplete,
  actionLabel = "Next",
}: SpotTheDifferenceTaskProps) {
  const { prompt, emoji, oddEmoji, gridSize, oddIndex } = content;

  const cells = useMemo(
    () => Array.from({ length: gridSize }, (_, i) => (i === oddIndex ? oddEmoji : emoji)),
    [gridSize, oddIndex, emoji, oddEmoji]
  );

  const [found, setFound] = useState(false);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);

  const columns = Math.min(6, Math.ceil(Math.sqrt(gridSize)));

  const tap = (index: number) => {
    if (found) return;
    if (index === oddIndex) {
      setFound(true);
      setWrongIndex(null);
    } else {
      setWrongIndex(index);
      window.setTimeout(() => setWrongIndex((prev) => (prev === index ? null : prev)), 350);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-center text-h3 font-black text-white">{prompt}</h2>

      <div
        className="mx-auto grid w-full gap-2 rounded-2xl border border-white/10 bg-black/20 p-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {cells.map((cellEmoji, index) => {
          const isFoundCell = found && index === oddIndex;
          const isWrong = wrongIndex === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => tap(index)}
              disabled={found}
              className={[
                "flex aspect-square items-center justify-center rounded-xl border text-2xl transition-all disabled:cursor-default",
                isFoundCell
                  ? "border-lime-green bg-lime-green/20 scale-110"
                  : isWrong
                    ? "border-neon-pink bg-neon-pink/20"
                    : "border-white/10 bg-white/5 hover:border-white/30",
              ].join(" ")}
            >
              {cellEmoji}
            </button>
          );
        })}
      </div>

      {found && <p className="text-center font-bold text-lime-green">Found it! 🎉</p>}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!found}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
