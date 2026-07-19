"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { OddOneOutContent } from "./types";

export interface OddOneOutTaskProps {
  content: OddOneOutContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * The child taps the word that doesn't belong with the rest. The odd word turns
 * green and a wrong pick turns red before they continue.
 */
export default function OddOneOutTask({
  content,
  onComplete,
  actionLabel = "Next",
}: OddOneOutTaskProps) {
  const { prompt, words, oddIndex } = content;

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === oddIndex;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-h2 font-black text-white">{prompt}</h2>

      <div className="grid grid-cols-2 gap-3">
        {words.map((word, index) => {
          const revealCorrect = answered && index === oddIndex;
          const revealWrong = answered && selected === index && index !== oddIndex;
          return (
            <button
              key={index}
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
              {word}
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
          {isCorrect ? "Spot on! 🎉" : "Not quite — the odd one is highlighted."}
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
