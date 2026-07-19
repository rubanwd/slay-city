"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { SlayButton } from "@/components/ui";

import { shuffle } from "./taskUtils";
import type { BubblePopContent } from "./types";

export interface BubblePopTaskProps {
  content: BubblePopContent;
  onComplete: () => void;
  actionLabel?: string;
}

interface Bubble {
  id: string;
  text: string;
  correct: boolean;
  hue: string;
  delay: number;
}

const HUES = [
  "border-neon-pink bg-neon-pink/15 text-white",
  "border-cyan bg-cyan/15 text-white",
  "border-purple bg-purple/25 text-white",
  "border-lime-green bg-lime-green/15 text-white",
];

/**
 * A field of gently bobbing bubbles. The child pops every correct word while
 * avoiding the distractors — a wrong tap flashes but doesn't end the round. The
 * task is done once all correct bubbles are popped.
 */
export default function BubblePopTask({
  content,
  onComplete,
  actionLabel = "Next",
}: BubblePopTaskProps) {
  const { prompt, correct, distractors } = content;

  const bubbles = useMemo<Bubble[]>(() => {
    const all = [
      ...correct.map((text, i) => ({ id: `c${i}`, text, correct: true })),
      ...distractors.map((text, i) => ({ id: `d${i}`, text, correct: false })),
    ];
    return shuffle(all).map((b, i) => ({
      ...b,
      hue: HUES[i % HUES.length],
      delay: (i % 5) * 0.15,
    }));
  }, [correct, distractors]);

  const [popped, setPopped] = useState<Set<string>>(new Set());
  const [wrongId, setWrongId] = useState<string | null>(null);
  const wrongTimer = useRef<number | null>(null);

  const correctIds = bubbles.filter((b) => b.correct).map((b) => b.id);
  const won = correctIds.every((id) => popped.has(id));

  useEffect(() => () => {
    if (wrongTimer.current) window.clearTimeout(wrongTimer.current);
  }, []);

  const pop = (bubble: Bubble) => {
    if (won) return;
    if (bubble.correct) {
      setPopped((prev) => new Set(prev).add(bubble.id));
    } else {
      setWrongId(bubble.id);
      if (wrongTimer.current) window.clearTimeout(wrongTimer.current);
      wrongTimer.current = window.setTimeout(() => setWrongId(null), 450);
    }
  };

  const remaining = correctIds.filter((id) => !popped.has(id)).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0 text-center">
        <p className="font-semibold text-white">{prompt}</p>
        <p className="text-small text-white/50">{remaining} left to pop</p>
      </div>

      <div className="min-h-0 flex-1 content-start items-center justify-center gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 flex flex-wrap">
        {bubbles.map((bubble) => {
          const isPopped = popped.has(bubble.id);
          const isWrong = wrongId === bubble.id;
          return (
            <button
              key={bubble.id}
              type="button"
              onClick={() => pop(bubble)}
              disabled={isPopped}
              style={{ animationDelay: `${bubble.delay}s` }}
              className={[
                "flex aspect-square min-w-[4.5rem] items-center justify-center rounded-full border-2 px-3 text-center text-small font-bold transition-all duration-300",
                isPopped
                  ? "scale-0 opacity-0"
                  : isWrong
                    ? "animate-pulse border-neon-pink bg-neon-pink/40 text-white"
                    : `${bubble.hue} animate-[bounce_2s_ease-in-out_infinite] hover:scale-110`,
              ].join(" ")}
            >
              {bubble.text}
            </button>
          );
        })}
      </div>

      {won && <p className="shrink-0 text-center font-bold text-lime-green">All popped! 🎉</p>}

      <SlayButton
        variant="green"
        size="lg"
        className="w-full shrink-0"
        onClick={onComplete}
        disabled={!won}
      >
        {actionLabel}
      </SlayButton>
    </div>
  );
}
