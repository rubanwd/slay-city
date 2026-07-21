"use client";

/* eslint-disable @next/next/no-img-element -- teacher-authored word images */

import { SlayButton, SlayCard } from "@/components/ui";

import type { HomeworkWord } from "./vocabulary";

export interface WordCardProps {
  word: HomeworkWord;
  /** Advances to the next card. */
  onNext: () => void;
  /** Label for the advance button (e.g. "Next" or "Start Test" on the last card). */
  actionLabel?: string;
}

/** Speaks the word aloud using the browser's speech synthesis, if available. */
function pronounce(word: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

/**
 * One vocabulary flashcard in the learning flow: the word's illustration, the
 * English word, its transcription and translation, plus a button that speaks
 * the word aloud (browser TTS — no stored audio). There is no wrong answer; the
 * child studies the card and taps to continue.
 */
export default function WordCard({ word, onNext, actionLabel = "Next" }: WordCardProps) {
  return (
    <div className="flex flex-col gap-6">
      <SlayCard variant="cyan" className="items-center gap-4 text-center">
        {word.imageUrl && (
          <div className="h-40 w-40 overflow-hidden rounded-2xl bg-white/5">
            <img src={word.imageUrl} alt={word.word} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <h2 className="text-h2 font-black text-white">{word.word}</h2>
          {word.transcription && <p className="text-lg font-semibold text-white/60">{word.transcription}</p>}
          <p className="text-lg font-semibold text-cyan">{word.translation}</p>
        </div>

        <button
          type="button"
          onClick={() => pronounce(word.word)}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
        >
          <span aria-hidden="true" className="text-xl">
            🔊
          </span>
          Listen
        </button>
      </SlayCard>

      <SlayButton variant="green" size="lg" className="w-full" onClick={onNext}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
