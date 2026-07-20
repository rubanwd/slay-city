"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { MathChallengeContent } from "./types";

export interface MathChallengeTaskProps {
  content: MathChallengeContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * An equation to solve, with the answer choices laid out like a small keypad.
 * Selecting an option reveals whether it was right before the child continues.
 */
export default function MathChallengeTask({
  content,
  onComplete,
  actionLabel = "Next",
}: MathChallengeTaskProps) {
  const { question, options, correctIndex } = content;

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-h1 font-black tracking-wide text-cyan">{question}</h2>

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
                "rounded-2xl border py-6 text-center text-h2 font-black transition-all",
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
          {isCorrect ? "Nice math! 🎉" : "Not quite — the answer is highlighted."}
        </p>
      )}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!answered}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
