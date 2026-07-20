"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { ColorMixingContent } from "./types";

export interface ColorMixingTaskProps {
  content: ColorMixingContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * Two color swatches are shown "mixing"; the child guesses the resulting color
 * name from a list of choices — a light introduction to color theory.
 */
export default function ColorMixingTask({
  content,
  onComplete,
  actionLabel = "Next",
}: ColorMixingTaskProps) {
  const { prompt, colorA, colorB, hexA, hexB, options, correctIndex } = content;

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-h2 font-black text-white">{prompt}</h2>

      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <span className="h-16 w-16 rounded-full border-2 border-white/20" style={{ backgroundColor: hexA }} />
          <span className="text-small text-white/60">{colorA}</span>
        </div>
        <span className="text-h2 font-black text-white/40">+</span>
        <div className="flex flex-col items-center gap-1.5">
          <span className="h-16 w-16 rounded-full border-2 border-white/20" style={{ backgroundColor: hexB }} />
          <span className="text-small text-white/60">{colorB}</span>
        </div>
        <span className="text-h2 font-black text-white/40">=</span>
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-white/30 text-2xl">
          ?
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
                "rounded-2xl border px-4 py-5 text-center text-body-strong font-bold transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan disabled:cursor-default",
                revealCorrect
                  ? "border-lime-green bg-lime-green/15 text-lime-green"
                  : revealWrong
                    ? "border-neon-pink bg-neon-pink/15 text-neon-pink"
                    : "border-white/15 bg-white/5 text-white hover:border-white/40",
              ].join(" ")}
            >
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <p className={["text-center font-bold", isCorrect ? "text-lime-green" : "text-neon-pink"].join(" ")}>
          {isCorrect ? "Nice mixing! 🎉" : "Not quite — the answer is highlighted."}
        </p>
      )}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!answered}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
