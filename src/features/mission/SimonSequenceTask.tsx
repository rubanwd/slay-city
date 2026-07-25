"use client";

import { useEffect, useRef, useState } from "react";

import { SlayButton } from "@/components/ui";

import type { SimonSequenceContent } from "./types";

export interface SimonSequenceTaskProps {
  content: SimonSequenceContent;
  onComplete: () => void;
  actionLabel?: string;
}

const HUES = [
  "border-neon-pink bg-neon-pink/20 text-white",
  "border-cyan bg-cyan/20 text-white",
  "border-lime-green bg-lime-green/20 text-white",
  "border-purple bg-purple/30 text-white",
];
const LIT_HUES = [
  "border-neon-pink bg-neon-pink scale-105 text-black",
  "border-cyan bg-cyan scale-105 text-black",
  "border-lime-green bg-lime-green scale-105 text-black",
  "border-purple bg-purple scale-105 text-white",
];

type Phase = "watching" | "input" | "wrong" | "done";

/**
 * A Simon-says memory game: the tiles light up in sequence, then the student taps
 * them back in the same order. A wrong tap replays the sequence for another try.
 */
export default function SimonSequenceTask({
  content,
  onComplete,
  actionLabel = "Next",
}: SimonSequenceTaskProps) {
  const { prompt, colors, sequence } = content;

  const [phase, setPhase] = useState<Phase>("watching");
  const [litIndex, setLitIndex] = useState<number | null>(null);
  const [input, setInput] = useState<number[]>([]);
  const [playToken, setPlayToken] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  // Schedules the watch-the-pattern playback. Re-runs on mount and whenever
  // `retry` bumps `playToken`; the state updates it drives happen inside the
  // scheduled timer callbacks, not synchronously in the effect body.
  useEffect(() => {
    sequence.forEach((colorIndex, i) => {
      const onAt = i * 700;
      const offAt = onAt + 450;
      timers.current.push(window.setTimeout(() => setLitIndex(colorIndex), onAt));
      timers.current.push(window.setTimeout(() => setLitIndex(null), offAt));
    });
    const doneAt = sequence.length * 700;
    timers.current.push(
      window.setTimeout(() => {
        setPhase("input");
      }, doneAt)
    );

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken]);

  const tap = (colorIndex: number) => {
    if (phase !== "input") return;
    const next = [...input, colorIndex];
    const stepOk = sequence[next.length - 1] === colorIndex;
    if (!stepOk) {
      setPhase("wrong");
      return;
    }
    setInput(next);
    if (next.length === sequence.length) {
      setPhase("done");
    }
  };

  const retry = () => {
    clearTimers();
    setPhase("watching");
    setInput([]);
    setLitIndex(null);
    setPlayToken((t) => t + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="font-semibold text-white">{prompt}</p>
        <p className="text-small text-white/50">
          {phase === "watching" && "Watch the pattern…"}
          {phase === "input" && `Your turn — tile ${input.length + 1} of ${sequence.length}`}
          {phase === "wrong" && "Not quite that order."}
          {phase === "done" && "You got it! 🎉"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {colors.map((color, index) => {
          const isLit = litIndex === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => tap(index)}
              disabled={phase !== "input"}
              className={[
                "rounded-2xl border-2 px-4 py-8 text-center text-body-strong font-bold transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan disabled:cursor-default",
                isLit ? LIT_HUES[index % LIT_HUES.length] : HUES[index % HUES.length],
              ].join(" ")}
            >
              {color}
            </button>
          );
        })}
      </div>

      {phase === "wrong" && (
        <SlayButton variant="pink" size="md" className="w-full" onClick={retry}>
          Watch again
        </SlayButton>
      )}

      <SlayButton
        variant="green"
        size="lg"
        className="w-full"
        onClick={onComplete}
        disabled={phase !== "done"}
      >
        {actionLabel}
      </SlayButton>
    </div>
  );
}
