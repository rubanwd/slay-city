"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { QuizContent } from "./types";

export interface QuizTaskProps {
  content: QuizContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * A multiple-choice question. Selecting an option reveals feedback — the correct
 * answer turns green, an incorrect pick turns red — before the student continues.
 */
export default function QuizTask({
  content,
  onComplete,
  actionLabel = "Continue",
}: QuizTaskProps) {
  const { question, imageUrl, options, correctIndex } = content;

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-h2 font-black text-white text-center">{question}</h2>

      {imageUrl && (
        <div className="mx-auto w-48 h-48 rounded-2xl overflow-hidden bg-white/5">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

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
                "w-full py-4 px-5 rounded-2xl border text-left font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
                "disabled:cursor-default",
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
        <p
          className={[
            "text-center font-bold",
            isCorrect ? "text-lime-green" : "text-neon-pink",
          ].join(" ")}
        >
          {isCorrect ? "You got this! 🎉" : "Not quite — the answer is highlighted."}
        </p>
      )}

      <SlayButton
        variant="green"
        size="lg"
        className="w-full"
        onClick={onComplete}
        disabled={!answered}
      >
        {actionLabel}
      </SlayButton>
    </div>
  );
}
