"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

import { SlayButton } from "@/components/ui";

import type { MatchingContent, MatchingPair } from "./types";

export interface MatchingTaskProps {
  content: MatchingContent;
  onComplete: () => void;
  actionLabel?: string;
}

/** Fisher–Yates shuffle returning a new array. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Word-to-image or word-to-translation matching. The student taps a word, then
 * its match; correct pairs lock in green and a wrong pick flashes red. When
 * every pair is matched the Continue button is enabled.
 */
export default function MatchingTask({
  content,
  onComplete,
  actionLabel = "Continue",
}: MatchingTaskProps) {
  const { prompt, mode, pairs } = content;

  // Shuffle each column once on mount (the component remounts per task).
  const [words] = useState<MatchingPair[]>(() => shuffle(pairs));
  const [matches] = useState<MatchingPair[]>(() => shuffle(pairs));

  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [wrongMatchId, setWrongMatchId] = useState<string | null>(null);

  const allMatched = resolved.size === pairs.length;

  const handleWordClick = (id: string) => {
    if (resolved.has(id)) return;
    setWrongMatchId(null);
    setSelectedWordId((current) => (current === id ? null : id));
  };

  const handleMatchClick = (pair: MatchingPair) => {
    if (resolved.has(pair.id) || selectedWordId === null) return;

    if (pair.id === selectedWordId) {
      setResolved((prev) => new Set(prev).add(pair.id));
      setSelectedWordId(null);
    } else {
      // Brief incorrect feedback, then reset the flash.
      setWrongMatchId(pair.id);
      window.setTimeout(() => setWrongMatchId(null), 500);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-white font-semibold text-center">{prompt}</p>

      <div className="grid grid-cols-2 gap-3">
        {/* Words column */}
        <div className="flex flex-col gap-3">
          {words.map((pair) => {
            const isResolved = resolved.has(pair.id);
            const isSelected = selectedWordId === pair.id;
            return (
              <button
                key={pair.id}
                onClick={() => handleWordClick(pair.id)}
                disabled={isResolved}
                className={[
                  "h-16 px-3 rounded-2xl border font-bold text-white transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
                  isResolved
                    ? "border-lime-green/60 bg-lime-green/15 text-lime-green cursor-default"
                    : isSelected
                      ? "border-cyan bg-cyan/15"
                      : "border-white/15 bg-white/5 hover:border-white/40",
                ].join(" ")}
              >
                {pair.word}
              </button>
            );
          })}
        </div>

        {/* Matches column */}
        <div className="flex flex-col gap-3">
          {matches.map((pair) => {
            const isResolved = resolved.has(pair.id);
            const isWrong = wrongMatchId === pair.id;
            return (
              <button
                key={pair.id}
                onClick={() => handleMatchClick(pair)}
                disabled={isResolved || selectedWordId === null}
                className={[
                  "h-16 px-3 rounded-2xl border overflow-hidden transition-all",
                  "flex items-center justify-center",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
                  "disabled:cursor-default",
                  isResolved
                    ? "border-lime-green/60 bg-lime-green/15"
                    : isWrong
                      ? "border-neon-pink bg-neon-pink/15"
                      : "border-white/15 bg-white/5 hover:border-white/40 disabled:hover:border-white/15",
                ].join(" ")}
              >
                {mode === "word-to-image" ? (
                  <img src={pair.match} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-bold text-white">{pair.match}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <SlayButton
        variant="green"
        size="lg"
        className="w-full"
        onClick={onComplete}
        disabled={!allMatched}
      >
        {actionLabel}
      </SlayButton>
    </div>
  );
}
