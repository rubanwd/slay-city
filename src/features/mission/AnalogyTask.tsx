"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { AnalogyContent } from "./types";

export interface AnalogyTaskProps {
  content: AnalogyContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * A verbal analogy: "A is to B as C is to ___?". The child taps the option
 * that completes the relationship.
 */
export default function AnalogyTask({
  content,
  onComplete,
  actionLabel = "Next",
}: AnalogyTaskProps) {
  const { wordA, wordB, wordC, options, correctIndex } = content;

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-h3 font-black text-white">
          {wordA} <span className="text-white/40">is to</span> {wordB}
        </p>
        <p className="mt-1 text-h3 font-black text-cyan">
          {wordC} <span className="text-white/40">is to</span> ___?
        </p>
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
                "rounded-2xl border px-4 py-6 text-center text-body-strong font-bold transition-all",
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
          {isCorrect ? "Sharp thinking! 🎉" : "Not quite — the answer is highlighted."}
        </p>
      )}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!answered}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
