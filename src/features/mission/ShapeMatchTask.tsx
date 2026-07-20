"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { ShapeMatchContent } from "./types";

export interface ShapeMatchTaskProps {
  content: ShapeMatchContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * A target shape is shown large; the child taps the matching shape from a grid
 * of choices — a simple spatial-recognition exercise.
 */
export default function ShapeMatchTask({
  content,
  onComplete,
  actionLabel = "Next",
}: ShapeMatchTaskProps) {
  const { prompt, targetShape, options, correctIndex } = content;

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-h2 font-black text-white">{prompt}</h2>

      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-6xl">
        {targetShape}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {options.map((option, index) => {
          const isThisSelected = selected === index;
          const revealCorrect = answered && index === correctIndex;
          const revealWrong = answered && isThisSelected && index !== correctIndex;
          return (
            <button
              key={option}
              onClick={() => !answered && setSelected(index)}
              disabled={answered}
              className={[
                "flex items-center justify-center rounded-2xl border py-6 text-4xl transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan disabled:cursor-default",
                revealCorrect
                  ? "border-lime-green bg-lime-green/15"
                  : revealWrong
                    ? "border-neon-pink bg-neon-pink/15"
                    : "border-white/15 bg-white/5 hover:border-white/40",
              ].join(" ")}
            >
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <p className={["text-center font-bold", isCorrect ? "text-lime-green" : "text-neon-pink"].join(" ")}>
          {isCorrect ? "Correct! 🎉" : "Not quite — the answer is highlighted."}
        </p>
      )}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!answered}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
