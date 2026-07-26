"use client";

import { useMemo, useRef, useState, useEffect } from "react";

import { SlayButton } from "@/components/ui";

import { shuffle } from "./taskUtils";
import type { CategorySortContent } from "./types";

export interface CategorySortTaskProps {
  content: CategorySortContent;
  onComplete: () => void;
  actionLabel?: string;
}

interface Item {
  id: number;
  text: string;
  categoryIndex: number;
}

/**
 * The student sorts every word into the right category: tap a word to pick it up,
 * then tap a bucket to drop it. A correct drop sticks; a wrong one flashes and
 * releases the word. The task is done once the tray is empty.
 */
export default function CategorySortTask({
  content,
  onComplete,
  actionLabel = "Next",
}: CategorySortTaskProps) {
  const { prompt, categories, items } = content;

  const allItems = useMemo<Item[]>(
    () => shuffle(items.map((it, id) => ({ id, text: it.text, categoryIndex: it.categoryIndex }))),
    [items]
  );

  const [placed, setPlaced] = useState<Record<number, number>>({}); // itemId -> categoryIndex
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongCategory, setWrongCategory] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const pool = allItems.filter((it) => placed[it.id] === undefined);
  const won = pool.length === 0;

  const drop = (categoryIndex: number) => {
    if (selected === null) return;
    const item = allItems.find((it) => it.id === selected)!;
    if (item.categoryIndex === categoryIndex) {
      setPlaced((prev) => ({ ...prev, [item.id]: categoryIndex }));
      setSelected(null);
    } else {
      setWrongCategory(categoryIndex);
      setSelected(null);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setWrongCategory(null), 450);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-center text-h3 font-semibold text-white">{prompt}</p>

      {/* Tray of unsorted words */}
      <div className="flex min-h-[3.5rem] flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/30 p-3">
        {won ? (
          <span className="font-bold text-lime-green">All sorted! 🎉</span>
        ) : (
          pool.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected((prev) => (prev === item.id ? null : item.id))}
              className={[
                "rounded-xl border px-3 py-2 text-body-strong font-bold transition-colors",
                selected === item.id
                  ? "border-cyan bg-cyan/20 text-white ring-2 ring-cyan"
                  : "border-white/20 bg-white/10 text-white hover:border-white/40",
              ].join(" ")}
            >
              {item.text}
            </button>
          ))
        )}
      </div>

      {/* Category buckets */}
      <div className="flex flex-col gap-3">
        {categories.map((category, index) => {
          const contents = allItems.filter((it) => placed[it.id] === index);
          return (
            <button
              key={index}
              type="button"
              onClick={() => drop(index)}
              disabled={won || selected === null}
              className={[
                "flex flex-col gap-2 rounded-2xl border-2 p-3 text-left transition-colors disabled:cursor-default",
                wrongCategory === index
                  ? "border-neon-pink bg-neon-pink/10"
                  : selected !== null
                    ? "border-cyan/60 bg-cyan/5"
                    : "border-white/15 bg-white/5",
              ].join(" ")}
            >
              <span className="text-label uppercase tracking-widest text-white/50">{category}</span>
              <div className="flex flex-wrap gap-1.5">
                {contents.length === 0 ? (
                  <span className="text-small text-white/30">Drop words here…</span>
                ) : (
                  contents.map((it) => (
                    <span
                      key={it.id}
                      className="rounded-lg border border-lime-green/50 bg-lime-green/10 px-2.5 py-1 text-small font-bold text-lime-green"
                    >
                      {it.text}
                    </span>
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>

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
