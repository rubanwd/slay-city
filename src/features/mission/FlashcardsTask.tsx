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
        aria-label={flipped ? "Show the front of the card" : "Show the answer"}
        className="flip-card-scene relative min-h-[16rem] w-full"
      >
        <div
          className={[
            "flip-card-inner relative h-full min-h-[16rem] w-full",
            flipped ? "is-flipped" : "",
          ].join(" ")}
        >
          {/* Front face
              `overflow-hidden` lives on the inner wrapper, not this element — WebKit
              (iOS Safari) fails to hide the backface when overflow-hidden sits on
              the same element as backface-visibility: hidden, which made both
              faces render on top of each other. */}
          <div
            className={[
              "flip-card-face absolute inset-0 rounded-3xl border-2 border-cyan",
              "shadow-[0_0_40px_-10px_rgba(0,240,255,0.5)]",
            ].join(" ")}
          >
            <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-cyan/25 via-black to-purple/25 p-6 text-center">
              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -right-12 h-44 w-44 rounded-full bg-purple/30 blur-3xl" />
              {card.imageUrl && (
                <div className="relative z-10 h-28 w-28 overflow-hidden rounded-2xl bg-white/5">
                  <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <span className="relative z-10 text-h1 font-black text-white">{card.front}</span>
              <span className="relative z-10 text-label uppercase tracking-widest text-white/40">
                Tap to flip
              </span>
            </div>
          </div>

          {/* Back face — same inner-wrapper split as the front face above. */}
          <div
            className={[
              "flip-card-face flip-card-face--back absolute inset-0 rounded-3xl border-2 border-lime-green",
              "shadow-[0_0_40px_-10px_rgba(157,255,0,0.5)]",
            ].join(" ")}
          >
            <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-lime-green/25 via-black to-neon-pink/25 p-6 text-center">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lime-green/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-neon-pink/30 blur-3xl" />
              <span className="relative z-10 text-h1 font-black text-white">{card.back}</span>
              <span className="relative z-10 text-label uppercase tracking-widest text-white/40">
                Answer
              </span>
            </div>
          </div>
        </div>
      </button>

      <SlayButton variant="green" size="lg" className="w-full" onClick={advance}>
        {isLast ? actionLabel : "Next card"}
      </SlayButton>
    </div>
  );
}
