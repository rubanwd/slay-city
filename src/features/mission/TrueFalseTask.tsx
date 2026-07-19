"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { TrueFalseContent } from "./types";

export interface TrueFalseTaskProps {
  content: TrueFalseContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * A statement the child judges true or false. The chosen button reveals whether
 * it was right before they continue.
 */
export default function TrueFalseTask({
  content,
  onComplete,
  actionLabel = "Next",
}: TrueFalseTaskProps) {
  const { statement, isTrue, imageUrl } = content;

  const [answer, setAnswer] = useState<boolean | null>(null);
  const answered = answer !== null;
  const isCorrect = answer === isTrue;

  const buttonClass = (value: boolean) => {
    const chosen = answer === value;
    if (!answered) {
      return value
        ? "border-lime-green/40 bg-lime-green/5 text-lime-green hover:bg-lime-green/10"
        : "border-neon-pink/40 bg-neon-pink/5 text-neon-pink hover:bg-neon-pink/10";
    }
    if (value === isTrue) return "border-lime-green bg-lime-green/15 text-lime-green";
    if (chosen) return "border-neon-pink bg-neon-pink/15 text-neon-pink";
    return "border-white/10 bg-white/[0.03] text-white/40";
  };

  return (
    <div className="flex flex-col gap-6">
      {imageUrl && (
        <div className="mx-auto h-40 w-40 overflow-hidden rounded-2xl bg-white/5">
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <h2 className="text-center text-h2 font-black text-white">{statement}</h2>

      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((value) => (
          <button
            key={String(value)}
            onClick={() => !answered && setAnswer(value)}
            disabled={answered}
            className={[
              "rounded-2xl border px-4 py-6 text-h3 font-black transition-all disabled:cursor-default",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
              buttonClass(value),
            ].join(" ")}
          >
            {value ? "True" : "False"}
          </button>
        ))}
      </div>

      {answered && (
        <p
          className={[
            "text-center font-bold",
            isCorrect ? "text-lime-green" : "text-neon-pink",
          ].join(" ")}
        >
          {isCorrect ? "Correct! 🎉" : `Actually, that's ${isTrue ? "true" : "false"}.`}
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
