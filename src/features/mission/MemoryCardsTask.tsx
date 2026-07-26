"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";

import { SlayButton } from "@/components/ui";

import { shuffle } from "./taskUtils";
import type { MemoryCardsContent } from "./types";

export interface MemoryCardsTaskProps {
  content: MemoryCardsContent;
  onComplete: () => void;
  actionLabel?: string;
}

interface Card {
  key: string;
  pairId: string;
  face: "word" | "match";
  value: string;
}

/**
 * A concentration game: the student flips two cards at a time to find the word and
 * its match (translation or picture). Matched pairs stay face-up; a mismatch
 * flips back after a beat. The task is done when every pair is found.
 */
export default function MemoryCardsTask({
  content,
  onComplete,
  actionLabel = "Next",
}: MemoryCardsTaskProps) {
  const { prompt, mode, pairs } = content;

  const cards = useMemo<Card[]>(() => {
    const deck = pairs.flatMap((pair) => [
      { key: `${pair.id}-w`, pairId: pair.id, face: "word" as const, value: pair.word },
      { key: `${pair.id}-m`, pairId: pair.id, face: "match" as const, value: pair.match },
    ]);
    return shuffle(deck);
  }, [pairs]);

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const won = matched.size === pairs.length;

  const flip = (card: Card) => {
    if (busy || matched.has(card.pairId) || flipped.includes(card.key)) return;

    const next = [...flipped, card.key];
    setFlipped(next);
    if (next.length < 2) return;

    const [aKey, bKey] = next;
    const a = cards.find((c) => c.key === aKey)!;
    const b = cards.find((c) => c.key === bKey)!;

    if (a.pairId === b.pairId) {
      setMatched((prev) => new Set(prev).add(a.pairId));
      setFlipped([]);
    } else {
      setBusy(true);
      timer.current = window.setTimeout(() => {
        setFlipped([]);
        setBusy(false);
      }, 900);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-center text-h3 font-semibold text-white">{prompt}</p>

      <div className="grid grid-cols-4 gap-2.5">
        {cards.map((card) => {
          const isUp = flipped.includes(card.key) || matched.has(card.pairId);
          const isImage = mode === "word-to-image" && card.face === "match";
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => flip(card)}
              disabled={isUp}
              className={[
                "flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border-2 p-1 text-center text-small font-bold transition-colors",
                isUp
                  ? matched.has(card.pairId)
                    ? "border-lime-green bg-lime-green/15 text-lime-green"
                    : "border-cyan bg-cyan/15 text-white"
                  : "border-white/15 bg-purple/30 text-transparent hover:border-white/40",
              ].join(" ")}
            >
              {isUp ? (
                isImage ? (
                  <img src={card.value} alt="" className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <span className="break-words leading-tight">{card.value}</span>
                )
              ) : (
                "?"
              )}
            </button>
          );
        })}
      </div>

      {won && <p className="text-center font-bold text-lime-green">Every pair found! 🎉</p>}

      <SlayButton
        variant="green"
        size="lg"
        className="w-full"
        onClick={onComplete}
        disabled={!won}
      >
        {actionLabel}
      </SlayButton>
    </div>
  );
}
