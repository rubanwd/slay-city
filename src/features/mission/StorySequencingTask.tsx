"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";

import { SlayButton } from "@/components/ui";

import { shuffle } from "./taskUtils";
import type { StorySequencingContent } from "./types";

export interface StorySequencingTaskProps {
  content: StorySequencingContent;
  onComplete: () => void;
  actionLabel?: string;
}

/**
 * The story's steps arrive shuffled and the student reorders them with the up/down
 * arrows. Checking reveals whether the sequence matches the authored order; the
 * task advances once it's correct.
 */
export default function StorySequencingTask({
  content,
  onComplete,
  actionLabel = "Next",
}: StorySequencingTaskProps) {
  const { prompt, steps } = content;

  const correctOrder = steps.map((s) => s.id);

  const initial = useMemo(() => {
    let order = shuffle(steps);
    for (let i = 0; i < 8 && order.map((s) => s.id).join() === correctOrder.join(); i++) {
      order = shuffle(steps);
    }
    return order;
  }, [steps, correctOrder]);

  const [order, setOrder] = useState(initial);
  const [checked, setChecked] = useState(false);

  const isCorrect = order.map((s) => s.id).join() === correctOrder.join();

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    setOrder((prev) => {
      const next = prev.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setChecked(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-center font-semibold text-white">{prompt}</p>

      <ol className="flex flex-col gap-2.5">
        {order.map((step, index) => {
          const wrongSpot = checked && !isCorrect && step.id !== correctOrder[index];
          return (
            <li
              key={step.id}
              className={[
                "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
                checked
                  ? isCorrect
                    ? "border-lime-green bg-lime-green/10"
                    : wrongSpot
                      ? "border-neon-pink/50 bg-neon-pink/5"
                      : "border-white/15 bg-white/5"
                  : "border-white/15 bg-white/5",
              ].join(" ")}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-small font-black text-white/70">
                {index + 1}
              </span>
              {step.imageUrl && (
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/5">
                  <img src={step.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <span className="min-w-0 flex-1 text-small text-white">{step.text}</span>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 text-white/70 hover:bg-white/10 disabled:opacity-25"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                  aria-label="Move down"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 text-white/70 hover:bg-white/10 disabled:opacity-25"
                >
                  ▼
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {checked && (
        <p className={["text-center font-bold", isCorrect ? "text-lime-green" : "text-neon-pink"].join(" ")}>
          {isCorrect ? "Perfect order! 🎉" : "Not yet — keep rearranging."}
        </p>
      )}

      {!isCorrect ? (
        <SlayButton variant="pink" size="lg" className="w-full" onClick={() => setChecked(true)}>
          Check Order
        </SlayButton>
      ) : (
        <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete}>
          {actionLabel}
        </SlayButton>
      )}
    </div>
  );
}
