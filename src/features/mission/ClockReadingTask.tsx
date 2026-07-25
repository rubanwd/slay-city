"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { ClockReadingContent } from "./types";

export interface ClockReadingTaskProps {
  content: ClockReadingContent;
  onComplete: () => void;
  actionLabel?: string;
}

const TICKS = Array.from({ length: 12 }, (_, i) => i);

/**
 * An analog clock face renders the authored time; the student reads it and taps
 * the matching digital time from the choices.
 */
export default function ClockReadingTask({
  content,
  onComplete,
  actionLabel = "Next",
}: ClockReadingTaskProps) {
  const { prompt, hour, minute, options, correctIndex } = content;

  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === correctIndex;

  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  const minuteAngle = minute * 6;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-h2 font-black text-white">{prompt}</h2>

      <svg viewBox="0 0 200 200" className="mx-auto h-44 w-44">
        <circle cx="100" cy="100" r="96" fill="#ffffff0d" stroke="#ffffff33" strokeWidth="3" />
        {TICKS.map((i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 100 + 82 * Math.sin(angle);
          const y1 = 100 - 82 * Math.cos(angle);
          const x2 = 100 + 92 * Math.sin(angle);
          const y2 = 100 - 92 * Math.cos(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff66" strokeWidth="3" />;
        })}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="55"
          stroke="#00F0FF"
          strokeWidth="5"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} 100 100)`}
        />
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="32"
          stroke="#9DFF00"
          strokeWidth="3.5"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} 100 100)`}
        />
        <circle cx="100" cy="100" r="5" fill="#ffffff" />
      </svg>

      <div className="grid grid-cols-2 gap-3">
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
                "rounded-2xl border px-4 py-5 text-center text-body-strong font-bold transition-all",
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
        <p className={["text-center font-bold", isCorrect ? "text-lime-green" : "text-neon-pink"].join(" ")}>
          {isCorrect ? "Right on time! 🎉" : "Not quite — the answer is highlighted."}
        </p>
      )}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!answered}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
