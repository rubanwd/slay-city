"use client";

import { useMemo, useState } from "react";

import { SlayButton } from "@/components/ui";

import { shuffle } from "./taskUtils";
import type { SentenceBuilderContent } from "./types";

export interface SentenceBuilderTaskProps {
  content: SentenceBuilderContent;
  onComplete: () => void;
  actionLabel?: string;
}

interface Chip {
  id: number;
  text: string;
}

/**
 * The sentence's words are shuffled into chips. The student taps them into the
 * answer row in order (tapping a placed chip returns it), and the row turns
 * green when the word order matches the authored sentence.
 */
export default function SentenceBuilderTask({
  content,
  onComplete,
  actionLabel = "Next",
}: SentenceBuilderTaskProps) {
  const { words, translation, prompt } = content;

  const chips = useMemo<Chip[]>(() => {
    const base = words.map((text, id) => ({ id, text }));
    let scrambled = shuffle(base);
    for (let i = 0; i < 8 && scrambled.map((c) => c.text).join(" ") === words.join(" "); i++) {
      scrambled = shuffle(base);
    }
    return scrambled;
  }, [words]);

  const [placed, setPlaced] = useState<number[]>([]);

  const placedSet = new Set(placed);
  const built = placed.map((id) => chips.find((c) => c.id === id)!.text);
  const solved = built.join(" ") === words.join(" ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-semibold text-white">{prompt}</p>
        {translation && <p className="text-small text-white/60">{translation}</p>}
      </div>

      {/* Answer row */}
      <div className="flex min-h-[3.5rem] flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/30 p-3">
        {placed.length === 0 ? (
          <span className="text-white/40">Tap the words below…</span>
        ) : (
          placed.map((id, index) => (
            <button
              key={id}
              type="button"
              onClick={() => setPlaced((prev) => prev.filter((_, i) => i !== index))}
              disabled={solved}
              className={[
                "rounded-xl border px-3 py-2 text-body-strong font-bold transition-colors",
                solved
                  ? "border-lime-green bg-lime-green/15 text-lime-green"
                  : "border-cyan/60 bg-cyan/10 text-white",
              ].join(" ")}
            >
              {chips.find((c) => c.id === id)!.text}
            </button>
          ))
        )}
      </div>

      {/* Word pool */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {chips.map((chip) => {
          const used = placedSet.has(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setPlaced((prev) => [...prev, chip.id])}
              disabled={used || solved}
              className={[
                "rounded-xl border px-4 py-2.5 text-body-strong font-bold transition-colors",
                used
                  ? "border-white/10 bg-white/[0.03] text-white/20"
                  : "border-white/20 bg-white/10 text-white hover:border-white/40",
              ].join(" ")}
            >
              {chip.text}
            </button>
          );
        })}
      </div>

      {placed.length > 0 && !solved && (
        <button
          type="button"
          onClick={() => setPlaced([])}
          className="mx-auto text-xs font-bold uppercase tracking-wide text-white/50 hover:text-white"
        >
          Clear
        </button>
      )}

      {solved && <p className="text-center font-bold text-lime-green">Great sentence! 🎉</p>}

      <SlayButton
        variant="green"
        size="lg"
        className="w-full"
        onClick={onComplete}
        disabled={!solved}
      >
        {actionLabel}
      </SlayButton>
    </div>
  );
}
