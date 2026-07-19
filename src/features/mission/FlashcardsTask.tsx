"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { FlashcardsContent } from "./types";

export interface FlashcardsTaskProps {
  content: FlashcardsContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * A self-paced review deck. The child taps a card to flip between its front and
 * back, then steps through every card. The advance button only finishes the task
 * once the last card has been reached.
 */
export default function FlashcardsTask({
  content,
  onComplete,
  actionLabel = "Next",
}: FlashcardsTaskProps) {
  const { prompt, cards } = content;

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];
  const isLast = index === cards.length - 1;

  const advance = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((i) => i + 1);
    setFlipped(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white">{prompt}</p>
        <span className="text-small font-bold text-white/50">
          {index + 1}/{cards.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={[
          "flex min-h-[16rem] w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 p-6 text-center transition-colors",
          flipped ? "border-lime-green bg-lime-green/10" : "border-cyan bg-cyan/10",
        ].join(" ")}
      >
        {!flipped && card.imageUrl && (
          <div className="h-28 w-28 overflow-hidden rounded-2xl bg-white/5">
            <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <span className="text-h1 font-black text-white">{flipped ? card.back : card.front}</span>
        <span className="text-label uppercase tracking-widest text-white/40">
          {flipped ? "Answer" : "Tap to flip"}
        </span>
      </button>

      <SlayButton variant="green" size="lg" className="w-full" onClick={advance}>
        {isLast ? actionLabel : "Next card"}
      </SlayButton>
    </div>
  );
}
