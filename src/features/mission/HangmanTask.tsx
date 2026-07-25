"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { HangmanContent } from "./types";

export interface HangmanTaskProps {
  content: HangmanContent;
  onComplete: () => void;
  actionLabel?: string;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_WRONG = 6;
/** The gallows fills in one emoji at a time as wrong guesses stack up. */
const STAGES = ["😀", "😯", "😟", "😧", "😨", "😰", "💀"];

/**
 * Classic hangman. The student reveals the word by guessing letters; six wrong
 * guesses ends the round and resets it. Non-letter characters (spaces) are shown
 * for free so multi-word answers still read clearly.
 */
export default function HangmanTask({
  content,
  onComplete,
  actionLabel = "Next",
}: HangmanTaskProps) {
  const { word, hint, translation } = content;

  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);

  const letters = word.split("");
  const requiredLetters = new Set(letters.filter((c) => /[A-Z]/.test(c)));
  const won = [...requiredLetters].every((c) => guessed.has(c));
  const lost = wrong >= MAX_WRONG;
  const finished = won || lost;

  const guess = (letter: string) => {
    if (guessed.has(letter) || finished) return;
    setGuessed((prev) => new Set(prev).add(letter));
    if (!requiredLetters.has(letter)) setWrong((w) => w + 1);
  };

  const reset = () => {
    setGuessed(new Set());
    setWrong(0);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="text-5xl">{STAGES[Math.min(wrong, STAGES.length - 1)]}</div>
        <p className="text-small text-white/50">
          {MAX_WRONG - wrong} {MAX_WRONG - wrong === 1 ? "life" : "lives"} left
        </p>
        {hint && <p className="text-small text-white/60">Hint: {hint}</p>}
      </div>

      {/* Word display */}
      <div className="flex flex-wrap items-end justify-center gap-1.5">
        {letters.map((char, index) => {
          if (!/[A-Z]/.test(char)) return <span key={index} className="w-3" />;
          const revealed = guessed.has(char) || lost;
          return (
            <span
              key={index}
              className={[
                "flex h-11 w-8 items-end justify-center border-b-2 pb-1 text-h3 font-black",
                revealed
                  ? won
                    ? "border-lime-green text-lime-green"
                    : lost && !guessed.has(char)
                      ? "border-neon-pink text-neon-pink"
                      : "border-white/40 text-white"
                  : "border-white/40 text-transparent",
              ].join(" ")}
            >
              {revealed ? char : "•"}
            </span>
          );
        })}
      </div>

      {finished ? (
        <div className="flex flex-col items-center gap-3">
          <p className={["font-bold", won ? "text-lime-green" : "text-neon-pink"].join(" ")}>
            {won ? "You saved the word! 🎉" : "Out of lives — the word is revealed."}
          </p>
          {won && translation && <p className="text-small text-white/60">{translation}</p>}
          {won ? (
            <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete}>
              {actionLabel}
            </SlayButton>
          ) : (
            <SlayButton variant="pink" size="lg" className="w-full" onClick={reset}>
              Try Again
            </SlayButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {ALPHABET.map((letter) => {
            const used = guessed.has(letter);
            const isWrong = used && !requiredLetters.has(letter);
            return (
              <button
                key={letter}
                type="button"
                onClick={() => guess(letter)}
                disabled={used}
                className={[
                  "flex h-10 items-center justify-center rounded-lg border text-small font-bold transition-colors",
                  used
                    ? isWrong
                      ? "border-neon-pink/40 bg-neon-pink/10 text-neon-pink/50"
                      : "border-lime-green/40 bg-lime-green/10 text-lime-green"
                    : "border-white/20 bg-white/10 text-white hover:border-white/40",
                ].join(" ")}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
