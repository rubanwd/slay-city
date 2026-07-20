"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { EmotionMatchContent } from "./types";

export interface EmotionMatchTaskProps {
  content: EmotionMatchContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * A face emoji is shown; the child taps the word that names the feeling it
 * expresses — a small social-emotional learning exercise.
 */
export default function EmotionMatchTask({
  content,
  onComplete,
  actionLabel = "Next",
}: EmotionMatchTaskProps) {
  const { prompt, emoji, options, correctIndex } = content;

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-h2 font-black text-white">{prompt}</h2>

      <div className="mx-auto text-8xl">{emoji}</div>

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
          {isCorrect ? "You got it! 🎉" : "Not quite — the answer is highlighted."}
        </p>
      )}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!answered}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
