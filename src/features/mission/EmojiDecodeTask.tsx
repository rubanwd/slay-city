"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { EmojiDecodeContent } from "./types";

export interface EmojiDecodeTaskProps {
  content: EmojiDecodeContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * An emoji rebus the child decodes by picking the word it spells out. The right
 * option turns green and a wrong pick turns red before they continue.
 */
export default function EmojiDecodeTask({
  content,
  onComplete,
  actionLabel = "Next",
}: EmojiDecodeTaskProps) {
  const { emojis, options, correctIndex, translation } = content;

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-2xl border border-white/15 bg-white/5 px-6 py-8 text-center text-5xl leading-tight">
          {emojis}
        </div>
        <p className="text-small text-white/50">What word is this?</p>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((option, index) => {
          const revealCorrect = answered && index === correctIndex;
          const revealWrong = answered && selected === index && index !== correctIndex;
          return (
            <button
              key={index}
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
        <p
          className={[
            "text-center font-bold",
            isCorrect ? "text-lime-green" : "text-neon-pink",
          ].join(" ")}
        >
          {isCorrect
            ? translation
              ? `Yes — ${translation}! 🎉`
              : "You got it! 🎉"
            : "Not quite — the answer is highlighted."}
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
