"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { CompareSizeContent } from "./types";

export interface CompareSizeTaskProps {
  content: CompareSizeContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * Two options side by side; the child taps the one that answers the prompt
 * (e.g. "Tap the bigger one").
 */
export default function CompareSizeTask({
  content,
  onComplete,
  actionLabel = "Next",
}: CompareSizeTaskProps) {
  const { prompt, optionA, optionB, imageUrlA, imageUrlB, correctOption } = content;

  const [selected, setSelected] = useState<"a" | "b" | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctOption;

  const cardClass = (option: "a" | "b") => {
    const isThisSelected = selected === option;
    const revealCorrect = answered && option === correctOption;
    const revealWrong = answered && isThisSelected && option !== correctOption;
    return [
      "flex flex-1 flex-col items-center gap-3 rounded-2xl border-2 px-3 py-6 text-center transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan disabled:cursor-default",
      revealCorrect
        ? "border-lime-green bg-lime-green/15 text-lime-green"
        : revealWrong
          ? "border-neon-pink bg-neon-pink/15 text-neon-pink"
          : "border-white/15 bg-white/5 text-white hover:border-white/40",
    ].join(" ");
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-h2 font-black text-white">{prompt}</h2>

      <div className="flex gap-3">
        <button type="button" onClick={() => !answered && setSelected("a")} disabled={answered} className={cardClass("a")}>
          {imageUrlA && (
            <div className="h-24 w-24 overflow-hidden rounded-xl bg-white/5">
              <img src={imageUrlA} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <span className="text-body-strong font-bold">{optionA}</span>
        </button>
        <button type="button" onClick={() => !answered && setSelected("b")} disabled={answered} className={cardClass("b")}>
          {imageUrlB && (
            <div className="h-24 w-24 overflow-hidden rounded-xl bg-white/5">
              <img src={imageUrlB} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <span className="text-body-strong font-bold">{optionB}</span>
        </button>
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
