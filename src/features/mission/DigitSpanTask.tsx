"use client";

import { useEffect, useRef, useState } from "react";

import { SlayButton } from "@/components/ui";

import type { DigitSpanContent } from "./types";

export interface DigitSpanTaskProps {
  content: DigitSpanContent;
  onComplete: () => void;
  actionLabel?: string;
}

type Phase = "watching" | "input" | "wrong" | "done";

const KEYPAD = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

/**
 * A classic working-memory drill: digits flash one at a time, then the child
 * recalls them in order on a numeric keypad. A wrong tap lets them replay the
 * sequence and try again.
 */
export default function DigitSpanTask({
  content,
  onComplete,
  actionLabel = "Next",
}: DigitSpanTaskProps) {
  const { prompt, digits } = content;

  const [phase, setPhase] = useState<Phase>("watching");
  const [shownDigit, setShownDigit] = useState<number | null>(null);
  const [input, setInput] = useState<number[]>([]);
  const [playToken, setPlayToken] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    digits.forEach((digit, i) => {
      const onAt = i * 900;
      const offAt = onAt + 600;
      timers.current.push(window.setTimeout(() => setShownDigit(digit), onAt));
      timers.current.push(window.setTimeout(() => setShownDigit(null), offAt));
    });
    const doneAt = digits.length * 900;
    timers.current.push(window.setTimeout(() => setPhase("input"), doneAt));

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken]);

  useEffect(() => clearTimers, []);

  const tap = (digit: number) => {
    if (phase !== "input") return;
    const next = [...input, digit];
    const stepOk = digits[next.length - 1] === digit;
    if (!stepOk) {
      setPhase("wrong");
      return;
    }
    setInput(next);
    if (next.length === digits.length) {
      setPhase("done");
    }
  };

  const retry = () => {
    clearTimers();
    setPhase("watching");
    setInput([]);
    setShownDigit(null);
    setPlayToken((t) => t + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="font-semibold text-white">{prompt}</p>
        <p className="text-small text-white/50">
          {phase === "watching" && "Watch closely…"}
          {phase === "input" && `Your turn — digit ${input.length + 1} of ${digits.length}`}
          {phase === "wrong" && "Not quite that order."}
          {phase === "done" && "Great memory! 🎉"}
        </p>
      </div>

      <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
        {phase === "watching" && shownDigit !== null && (
          <span className="text-6xl font-black text-cyan">{shownDigit}</span>
        )}
        {phase !== "watching" && (
          <div className="flex gap-2">
            {digits.map((_, i) => (
              <span
                key={i}
                className={[
                  "flex h-10 w-8 items-center justify-center rounded-lg border text-body-strong font-black",
                  i < input.length
                    ? "border-cyan/60 bg-cyan/10 text-white"
                    : "border-dashed border-white/20 text-white/20",
                ].join(" ")}
              >
                {i < input.length ? input[i] : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {KEYPAD.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => tap(digit)}
            disabled={phase !== "input"}
            className="rounded-xl border border-white/20 bg-white/10 py-3 text-h3 font-black text-white transition-colors hover:border-white/40 disabled:cursor-default disabled:opacity-40"
          >
            {digit}
          </button>
        ))}
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
