"use client";

/* eslint-disable @next/next/no-img-element */

import { SlayButton, SlayCard } from "@/components/ui";

import type { VocabularyContent } from "./types";

export interface VocabularyTaskProps {
  content: VocabularyContent;
  /** Advances the mission to the next task. */
  onComplete: () => void;
  /** Label for the advance button (e.g. "Next" or "Finish" on the last task). */
  actionLabel?: string;
}

/**
 * A read-only "learn this word" task: shows the word, its translation, an
 * illustrative image, and an example sentence. There is no wrong answer — the
 * child reviews the card and taps Next.
 */
export default function VocabularyTask({
  content,
  onComplete,
  actionLabel = "Next",
}: VocabularyTaskProps) {
  const { word, translation, imageUrl, exampleSentence } = content;

  return (
    <div className="flex flex-col gap-6">
      <SlayCard variant="cyan" className="items-center gap-4 text-center">
        {imageUrl && (
          <div className="w-40 h-40 rounded-2xl overflow-hidden bg-white/5">
            <img
              src={imageUrl}
              alt={word}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <h2 className="text-h2 font-black text-white">{word}</h2>
          <p className="text-lg font-semibold text-cyan">{translation}</p>
        </div>

        {exampleSentence && (
          <p className="text-white/70 italic max-w-xs">&ldquo;{exampleSentence}&rdquo;</p>
        )}
      </SlayCard>

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
