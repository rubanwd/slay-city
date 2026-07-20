"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { NumberPatternContent } from "./types";

export interface NumberPatternTaskProps {
  content: NumberPatternContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * A sequence with one blank tile (shown as "?"). The child taps the option
 * that continues the pattern; the blank then fills in with their pick.
 */
export default function NumberPatternTask({
  content,
  onComplete,
  actionLabel = "Next",
}: NumberPatternTaskProps) {
  const { prompt, sequence, blankIndex, options, correctIndex } = content;

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-h2 font-black text-white">{prompt}</h2>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {sequence.map((item, index) => {
          const isBlank = index === blankIndex;
          return (
            <div
              key={index}
              className={[
                "flex h-14 min-w-[3.5rem] items-center justify-center rounded-xl border px-3 text-h3 font-black",
                isBlank
                  ? answered
                    ? isCorrect
                      ? "border-lime-green bg-lime-green/15 text-lime-green"
                      : "border-neon-pink bg-neon-pink/15 text-neon-pink"
                    : "border-dashed border-cyan/60 bg-cyan/5 text-cyan"
                  : "border-white/15 bg-white/5 text-white",
              ].join(" ")}
            >
              {isBlank ? (answered ? options[correctIndex] : "?") : item}
            </div>
          );
        })}
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
          {isCorrect ? "Pattern cracked! 🎉" : "Not quite — the answer is highlighted."}
        </p>
      )}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!answered}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
