"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import { normalizeAnswer } from "./taskUtils";
import type { FillBlankContent } from "./types";

export interface FillBlankTaskProps {
  content: FillBlankContent;
  onComplete: () => void;
  actionLabel?: string;
}

const BLANK_PATTERN = /_{2,}/;

/**
 * A sentence with a gap. When options are authored the child taps the right
 * word; otherwise they type it. The answer check is case- and space-insensitive.
 */
export default function FillBlankTask({
  content,
  onComplete,
  actionLabel = "Next",
}: FillBlankTaskProps) {
  const { sentence, answer, options, translation } = content;
  const hasOptions = options.length >= 2;

  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);

  const correctByOption = selected !== null && normalizeAnswer(options[selected]) === normalizeAnswer(answer);
  const correctByTyped = normalizeAnswer(typed) === normalizeAnswer(answer);
  const isCorrect = hasOptions ? correctByOption : correctByTyped;

  const parts = sentence.split(BLANK_PATTERN);
  const before = parts[0] ?? "";
  const after = parts.slice(1).join(" ");

  const filledWord = checked && isCorrect ? answer : hasOptions && selected !== null ? options[selected] : typed;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/15 bg-white/5 p-5 text-center text-h3 font-bold leading-relaxed text-white">
        {before}
        <span
          className={[
            "mx-1 inline-block min-w-[3rem] border-b-2 px-2 pb-0.5",
            checked ? (isCorrect ? "border-lime-green text-lime-green" : "border-neon-pink text-neon-pink") : "border-cyan text-cyan",
          ].join(" ")}
        >
          {filledWord || "…"}
        </span>
        {after}
      </div>
      {translation && <p className="text-center text-small text-white/50">{translation}</p>}

      {hasOptions ? (
        <div className="grid grid-cols-2 gap-3">
          {options.map((option, index) => {
            const revealCorrect = checked && normalizeAnswer(option) === normalizeAnswer(answer);
            const revealWrong = checked && selected === index && !isCorrect;
            return (
              <button
                key={index}
                onClick={() => {
                  if (checked) return;
                  setSelected(index);
                }}
                disabled={checked}
                className={[
                  "rounded-2xl border px-4 py-4 text-center font-bold transition-all disabled:cursor-default",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
                  revealCorrect
                    ? "border-lime-green bg-lime-green/15 text-lime-green"
                    : revealWrong
                      ? "border-neon-pink bg-neon-pink/15 text-neon-pink"
                      : selected === index
                        ? "border-cyan bg-cyan/10 text-white"
                        : "border-white/15 bg-white/5 text-white hover:border-white/40",
                ].join(" ")}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          value={typed}
          onChange={(e) => !checked && setTyped(e.target.value)}
          placeholder="Type the missing word"
          disabled={checked}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-white placeholder-white/40 caret-neon-pink focus:border-neon-pink focus:outline-none focus:ring-2 focus:ring-neon-pink/60"
        />
      )}

      {checked && (
        <p className={["text-center font-bold", isCorrect ? "text-lime-green" : "text-neon-pink"].join(" ")}>
          {isCorrect ? "Correct! 🎉" : `The answer is "${answer}".`}
        </p>
      )}

      {!checked && (
        <SlayButton
          variant="pink"
          size="lg"
          className="w-full"
          onClick={() => setChecked(true)}
          disabled={hasOptions ? selected === null : typed.trim() === ""}
        >
          Check
        </SlayButton>
      )}

      {checked && isCorrect && (
        <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete}>
          {actionLabel}
        </SlayButton>
      )}

      {checked && !isCorrect && (
        <SlayButton
          variant="pink"
          size="lg"
          className="w-full"
          onClick={() => {
            setChecked(false);
            setSelected(null);
            setTyped("");
          }}
        >
          Try Again
        </SlayButton>
      )}
    </div>
  );
}
