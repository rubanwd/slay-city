"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { SlayButton } from "@/components/ui";

import { shuffle } from "./taskUtils";
import type { ReactionTapContent } from "./types";

export interface ReactionTapTaskProps {
  content: ReactionTapContent;
  onComplete: () => void;
  actionLabel?: string;
}

interface Chip {
  id: string;
  text: string;
  correct: boolean;
}

/**
 * A timed round: tap every correct word before the clock runs out while
 * avoiding the distractors. Ends in either a win (all correct tapped) or a
 * timeout — either way the student can move on.
 */
export default function ReactionTapTask({
  content,
  onComplete,
  actionLabel = "Next",
}: ReactionTapTaskProps) {
  const { prompt, correct, distractors, roundSeconds } = content;

  const chips = useMemo<Chip[]>(() => {
    const all = [
      ...correct.map((text, i) => ({ id: `c${i}`, text, correct: true })),
      ...distractors.map((text, i) => ({ id: `d${i}`, text, correct: false })),
    ];
    return shuffle(all);
  }, [correct, distractors]);

  const [tapped, setTapped] = useState<Set<string>>(new Set());
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(roundSeconds);
  const wrongTimer = useRef<number | null>(null);

  const correctIds = chips.filter((c) => c.correct).map((c) => c.id);
  const won = correctIds.every((id) => tapped.has(id));
  const timedOut = secondsLeft <= 0 && !won;
  const roundOver = won || timedOut;

  useEffect(() => {
    if (roundOver) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [roundOver]);

  useEffect(
    () => () => {
      if (wrongTimer.current) window.clearTimeout(wrongTimer.current);
    },
    []
  );

  const tap = (chip: Chip) => {
    if (roundOver || tapped.has(chip.id)) return;
    if (chip.correct) {
      setTapped((prev) => new Set(prev).add(chip.id));
    } else {
      setWrongId(chip.id);
      if (wrongTimer.current) window.clearTimeout(wrongTimer.current);
      wrongTimer.current = window.setTimeout(() => setWrongId(null), 400);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-h3 font-semibold text-white">{prompt}</p>
        <p className={["text-small font-bold", secondsLeft <= 5 && !roundOver ? "text-neon-pink" : "text-white/50"].join(" ")}>
          {roundOver ? (won ? "All tapped! 🎉" : "Time's up!") : `⏱ ${secondsLeft}s left`}
        </p>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan transition-all duration-1000 ease-linear"
          style={{ width: `${roundOver ? 0 : (secondsLeft / roundSeconds) * 100}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
        {chips.map((chip) => {
          const isTapped = tapped.has(chip.id);
          const isWrong = wrongId === chip.id;
          const missedCorrect = roundOver && chip.correct && !isTapped;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => tap(chip)}
              disabled={roundOver || isTapped}
              className={[
                "rounded-full border-2 px-4 py-2.5 text-small font-bold transition-all disabled:cursor-default",
                isTapped
                  ? "border-lime-green bg-lime-green/15 text-lime-green"
                  : isWrong
                    ? "border-neon-pink bg-neon-pink/40 text-white"
                    : missedCorrect
                      ? "border-lime-green/60 bg-lime-green/5 text-lime-green/70"
                      : "border-white/20 bg-white/10 text-white hover:border-white/40",
              ].join(" ")}
            >
              {chip.text}
            </button>
          );
        })}
      </div>

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!roundOver}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
