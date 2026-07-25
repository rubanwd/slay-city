"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { PictureRevealContent } from "./types";

export interface PictureRevealTaskProps {
  content: PictureRevealContent;
  onComplete: () => void;
  actionLabel?: string;
}

const BLUR_STAGES = [20, 12, 6];
const MAX_HINT_STAGE = BLUR_STAGES.length - 1;

/**
 * A blurred image sharpens each time the student taps "Reveal more". They can
 * guess at any point; picking an option locks the answer and fully reveals
 * the picture.
 */
export default function PictureRevealTask({
  content,
  onComplete,
  actionLabel = "Next",
}: PictureRevealTaskProps) {
  const { prompt, imageUrl, options, correctIndex } = content;

  const [stage, setStage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;
  const blur = answered ? 0 : BLUR_STAGES[stage];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-h2 font-black text-white">{prompt}</h2>

      <div className="mx-auto h-48 w-48 overflow-hidden rounded-2xl bg-white/5">
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover transition-[filter] duration-500"
          style={{ filter: `blur(${blur}px)` }}
        />
      </div>

      {!answered && stage < MAX_HINT_STAGE && (
        <button
          type="button"
          onClick={() => setStage((s) => Math.min(MAX_HINT_STAGE, s + 1))}
          className="mx-auto text-xs font-bold uppercase tracking-wide text-cyan hover:underline"
        >
          Reveal more
        </button>
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
          {isCorrect ? "Sharp eyes! 🎉" : "Not quite — the answer is highlighted."}
        </p>
      )}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!answered}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
