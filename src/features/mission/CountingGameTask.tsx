"use client";

import { useMemo, useState } from "react";

import { SlayButton } from "@/components/ui";

import { shuffle } from "./taskUtils";
import type { CountingGameContent } from "./types";

export interface CountingGameTaskProps {
  content: CountingGameContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * A grid of the same emoji, repeated `count` times. The child counts them and
 * taps the matching number from the choices.
 */
export default function CountingGameTask({
  content,
  onComplete,
  actionLabel = "Next",
}: CountingGameTaskProps) {
  const { prompt, emoji, count, options } = content;

  const items = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  const shuffledOptions = useMemo(() => shuffle(options), [options]);

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === count;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-h2 font-black text-white">{prompt}</h2>

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-5">
        {items.map((i) => (
          <span key={i} className="text-4xl leading-none">
            {emoji}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {shuffledOptions.map((option) => {
          const isThisSelected = selected === option;
          const revealCorrect = answered && option === count;
          const revealWrong = answered && isThisSelected && option !== count;
          return (
            <button
              key={option}
              onClick={() => !answered && setSelected(option)}
              disabled={answered}
              className={[
                "rounded-2xl border py-5 text-center text-h3 font-black transition-all",
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
          {isCorrect ? "Correct! 🎉" : `Not quite — there are ${count}.`}
        </p>
      )}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!answered}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
