"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { DialogueChoiceContent } from "./types";

export interface DialogueChoiceTaskProps {
  content: DialogueChoiceContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * A chat-style line the child reads, then a set of reply bubbles to pick the
 * best response from — practicing conversational language.
 */
export default function DialogueChoiceTask({
  content,
  onComplete,
  actionLabel = "Next",
}: DialogueChoiceTaskProps) {
  const { prompt, speaker, options, correctIndex, translation } = content;

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg">💬</span>
        <div className="flex flex-col gap-1">
          {speaker && <span className="text-xs font-bold uppercase tracking-wide text-white/40">{speaker}</span>}
          <div className="rounded-2xl rounded-tl-sm border border-white/15 bg-white/5 px-4 py-3 text-body-strong text-white">
            {prompt}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
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
                "max-w-[85%] rounded-2xl rounded-tr-sm border px-4 py-3 text-left font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan disabled:cursor-default",
                revealCorrect
                  ? "border-lime-green bg-lime-green/15 text-lime-green"
                  : revealWrong
                    ? "border-neon-pink bg-neon-pink/15 text-neon-pink"
                    : "border-cyan/40 bg-cyan/10 text-white hover:border-cyan/70",
              ].join(" ")}
            >
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="text-center">
          <p className={["font-bold", isCorrect ? "text-lime-green" : "text-neon-pink"].join(" ")}>
            {isCorrect ? "Great reply! 🎉" : "Not quite — the best reply is highlighted."}
          </p>
          {translation && <p className="mt-1 text-small text-white/50">{translation}</p>}
        </div>
      )}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!answered}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
