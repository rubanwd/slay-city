"use client";

import { useMemo, useState } from "react";

import { SlayButton } from "@/components/ui";

import { shuffle } from "./taskUtils";
import type { LetterFillContent } from "./types";

export interface LetterFillTaskProps {
  content: LetterFillContent;
  onComplete: () => void;
  actionLabel?: string;
}

interface BankLetter {
  id: number;
  char: string;
}

/** Every other letter is blanked, always leaving the first letter visible. */
function blankIndicesFor(word: string): number[] {
  const indices = word.split("").map((_, i) => i).filter((i) => i % 2 === 1);
  return indices.length > 0 ? indices : [word.length - 1];
}

/**
 * A word with some letters already filled in and the rest blanked out. The
 * child taps letters from the shuffled bank, in order, to complete the word.
 */
export default function LetterFillTask({
  content,
  onComplete,
  actionLabel = "Next",
}: LetterFillTaskProps) {
  const { word, hint, translation } = content;

  const blanks = useMemo(() => blankIndicesFor(word), [word]);
  const bank = useMemo<BankLetter[]>(() => {
    const letters = blanks.map((i, id) => ({ id, char: word[i] }));
    return shuffle(letters);
  }, [word, blanks]);

  const [placed, setPlaced] = useState<number[]>([]);

  const placedSet = new Set(placed);
  const solved = placed.length === blanks.length;
  const built = word
    .split("")
    .map((char, i) => {
      const blankPos = blanks.indexOf(i);
      if (blankPos === -1) return char;
      if (blankPos >= placed.length) return null;
      return bank.find((b) => b.id === placed[blankPos])!.char;
    });
  const isCorrect = solved && built.join("") === word;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        {translation && <p className="text-lg font-semibold text-cyan">{translation}</p>}
        {hint && <p className="text-small text-white/60">Hint: {hint}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {built.map((char, i) => (
          <div
            key={i}
            className={[
              "flex h-12 w-10 items-center justify-center rounded-lg border text-body-strong font-black",
              char === null
                ? "border-dashed border-white/30 bg-white/[0.03] text-white/30"
                : solved
                  ? isCorrect
                    ? "border-lime-green bg-lime-green/15 text-lime-green"
                    : "border-neon-pink bg-neon-pink/15 text-neon-pink"
                  : "border-cyan/60 bg-cyan/10 text-white",
            ].join(" ")}
          >
            {char ?? ""}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {bank.map((letter) => {
          const used = placedSet.has(letter.id);
          return (
            <button
              key={letter.id}
              type="button"
              onClick={() => !solved && setPlaced((prev) => [...prev, letter.id])}
              disabled={used || solved}
              className={[
                "flex h-12 w-10 items-center justify-center rounded-xl border text-h3 font-black transition-colors",
                used
                  ? "border-white/10 bg-white/[0.03] text-white/20"
                  : "border-white/20 bg-white/10 text-white hover:border-white/40",
              ].join(" ")}
            >
              {letter.char}
            </button>
          );
        })}
      </div>

      {placed.length > 0 && !solved && (
        <button
          type="button"
          onClick={() => setPlaced([])}
          className="mx-auto text-xs font-bold uppercase tracking-wide text-white/50 hover:text-white"
        >
          Clear
        </button>
      )}

      {solved && (
        <p className={["text-center font-bold", isCorrect ? "text-lime-green" : "text-neon-pink"].join(" ")}>
          {isCorrect ? "Perfect! 🎉" : "Not quite right — tap Clear to try again."}
        </p>
      )}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!isCorrect}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
