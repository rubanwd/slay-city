"use client";

import { SlayButton, SlayCard } from "@/components/ui";

import type { HomeworkGrammarPoint } from "./grammar";

export interface GrammarCardProps {
  point: HomeworkGrammarPoint;
  /** Advances to the next card. */
  onNext: () => void;
  /** Label for the advance button (e.g. "Next" or "Start Test" on the last card). */
  actionLabel?: string;
}

/**
 * One grammar rule card in the learning flow: the rule title, a short
 * explanation, and an example sentence. The sibling of {@link WordCard} —
 * there is no wrong answer; the child reads the rule and taps to continue.
 */
export default function GrammarCard({ point, onNext, actionLabel = "Next" }: GrammarCardProps) {
  return (
    <div className="flex flex-col gap-6">
      <SlayCard variant="cyan" className="gap-4">
        <h2 className="text-h3 font-black text-white">{point.title}</h2>
        <p className="whitespace-pre-wrap text-body text-white/80">{point.explanation}</p>
        {point.example && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">Example</p>
            <p className="mt-1 text-lg font-semibold text-cyan">{point.example}</p>
          </div>
        )}
      </SlayCard>

      <SlayButton variant="green" size="lg" className="w-full" onClick={onNext}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
