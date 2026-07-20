"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { CauseEffectContent } from "./types";

export interface CauseEffectTaskProps {
  content: CauseEffectContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * A cause is shown; the child taps the option that describes what happens
 * next — a simple reasoning exercise.
 */
export default function CauseEffectTask({
  content,
  onComplete,
  actionLabel = "Next",
}: CauseEffectTaskProps) {
  const { cause, options, correctIndex } = content;

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-center">
        <span className="text-xs font-bold uppercase tracking-wide text-white/40">If this happens…</span>
        <p className="mt-1 text-h3 font-black text-white">{cause}</p>
      </div>

      <p className="text-center text-small text-white/50">What happens next?</p>

      <div className="flex flex-col gap-3">
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
                "w-full rounded-2xl border px-5 py-4 text-left font-medium transition-all",
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
          {isCorrect ? "Good thinking! 🎉" : "Not quite — the answer is highlighted."}
        </p>
      )}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!answered}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
