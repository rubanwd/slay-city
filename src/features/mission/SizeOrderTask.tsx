"use client";

import { useMemo, useState } from "react";

import { SlayButton } from "@/components/ui";

import { shuffle } from "./taskUtils";
import type { SizeOrderContent } from "./types";

export interface SizeOrderTaskProps {
  content: SizeOrderContent;
  onComplete: () => void;
  actionLabel?: string;
}

interface Chip {
  id: number;
  text: string;
}

/**
 * The items arrive shuffled; the student taps them into the answer row in the
 * authored order (e.g. smallest to largest). Tapping a placed chip returns it
 * to the pool.
 */
export default function SizeOrderTask({
  content,
  onComplete,
  actionLabel = "Next",
}: SizeOrderTaskProps) {
  const { prompt, items } = content;

  const chips = useMemo<Chip[]>(() => {
    const base = items.map((text, id) => ({ id, text }));
    let scrambled = shuffle(base);
    for (let i = 0; i < 8 && scrambled.map((c) => c.text).join("|") === items.join("|"); i++) {
      scrambled = shuffle(base);
    }
    return scrambled;
  }, [items]);

  const [placed, setPlaced] = useState<number[]>([]);

  const placedSet = new Set(placed);
  const built = placed.map((id) => chips.find((c) => c.id === id)!.text);
  const solved = built.length === items.length && built.join("|") === items.join("|");

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-h3 font-black text-white">{prompt}</h2>

      {/* Answer row */}
      <div className="flex min-h-[3.5rem] flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/30 p-3">
        {placed.length === 0 ? (
          <span className="text-white/40">Tap the items below…</span>
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
              {index + 1}. {chips.find((c) => c.id === id)!.text}
            </button>
          ))
        )}
      </div>

      {/* Item pool */}
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

      {solved && <p className="text-center font-bold text-lime-green">Perfect order! 🎉</p>}

      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete} disabled={!solved}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
