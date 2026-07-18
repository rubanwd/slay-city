"use client";

import { useMemo, useState } from "react";

import { SlayButton } from "@/components/ui";

import type { WordSearchContent } from "./types";

export interface WordSearchTaskProps {
  content: WordSearchContent;
  onComplete: () => void;
  actionLabel?: string;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
// Placement directions; selection accepts these and their reverses.
const PLACE_DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface Generated {
  grid: string[][];
  placed: string[];
}

/** Places each word in a random straight line, then fills the gaps with noise. */
function generateGrid(words: string[], size: number): Generated {
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const placed: string[] = [];

  for (const word of words) {
    const len = word.length;
    if (len > size) continue;
    let done = false;
    for (let attempt = 0; attempt < 300 && !done; attempt++) {
      const [dr, dc] = PLACE_DIRS[randInt(0, PLACE_DIRS.length - 1)];
      const r0 = dr === 1 ? randInt(0, size - len) : randInt(0, size - 1);
      const c0 = dc === 1 ? randInt(0, size - len) : dc === -1 ? randInt(len - 1, size - 1) : randInt(0, size - 1);

      let fits = true;
      for (let k = 0; k < len; k++) {
        const cell = grid[r0 + dr * k][c0 + dc * k];
        if (cell !== null && cell !== word[k]) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;

      for (let k = 0; k < len; k++) grid[r0 + dr * k][c0 + dc * k] = word[k];
      placed.push(word);
      done = true;
    }
  }

  const filled = grid.map((row) =>
    row.map((cell) => cell ?? ALPHABET[randInt(0, ALPHABET.length - 1)])
  );
  return { grid: filled, placed };
}

const cellKey = (r: number, c: number) => `${r},${c}`;

/**
 * A word-search puzzle. The child taps the first and last letter of a word; if
 * the straight line between them spells one of the hidden words (in either
 * direction) it locks in green. The task is done when every word is found.
 */
export default function WordSearchTask({
  content,
  onComplete,
  actionLabel = "Next",
}: WordSearchTaskProps) {
  const { prompt, words, size } = content;

  const { grid, placed } = useMemo(() => generateGrid(words, size), [words, size]);
  const placedSet = useMemo(() => new Set(placed), [placed]);

  const [first, setFirst] = useState<{ r: number; c: number } | null>(null);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());

  const won = found.size === placed.length && placed.length > 0;

  const lineCells = (a: { r: number; c: number }, b: { r: number; c: number }) => {
    const dr = Math.sign(b.r - a.r);
    const dc = Math.sign(b.c - a.c);
    const straight = a.r === b.r || a.c === b.c || Math.abs(b.r - a.r) === Math.abs(b.c - a.c);
    if (!straight) return null;
    const steps = Math.max(Math.abs(b.r - a.r), Math.abs(b.c - a.c));
    const cells: { r: number; c: number }[] = [];
    for (let k = 0; k <= steps; k++) cells.push({ r: a.r + dr * k, c: a.c + dc * k });
    return cells;
  };

  const tapCell = (r: number, c: number) => {
    if (won) return;
    if (!first) {
      setFirst({ r, c });
      return;
    }
    const cells = lineCells(first, { r, c });
    if (!cells) {
      setFirst({ r, c });
      return;
    }
    const word = cells.map((cell) => grid[cell.r][cell.c]).join("");
    const reversed = word.split("").reverse().join("");
    const match = placedSet.has(word) ? word : placedSet.has(reversed) ? reversed : null;

    if (match && !found.has(match)) {
      setFound((prev) => new Set(prev).add(match));
      setFoundCells((prev) => {
        const next = new Set(prev);
        cells.forEach((cell) => next.add(cellKey(cell.r, cell.c)));
        return next;
      });
    }
    setFirst(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-semibold text-white">{prompt}</p>

      <div
        className="mx-auto grid w-full max-w-sm gap-0.5"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) =>
          row.map((letter, c) => {
            const key = cellKey(r, c);
            const isFound = foundCells.has(key);
            const isFirst = first?.r === r && first?.c === c;
            return (
              <button
                key={key}
                type="button"
                onClick={() => tapCell(r, c)}
                className={[
                  "flex aspect-square items-center justify-center rounded-[4px] text-[11px] font-black uppercase transition-colors sm:text-sm",
                  isFound
                    ? "bg-lime-green/25 text-lime-green"
                    : isFirst
                      ? "bg-cyan/30 text-white ring-2 ring-cyan"
                      : "bg-white/5 text-white/80 hover:bg-white/10",
                ].join(" ")}
              >
                {letter}
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {placed.map((word) => (
          <span
            key={word}
            className={[
              "rounded-full border px-3 py-1 text-small font-bold transition-colors",
              found.has(word)
                ? "border-lime-green/50 bg-lime-green/10 text-lime-green line-through"
                : "border-white/20 text-white/70",
            ].join(" ")}
          >
            {word}
          </span>
        ))}
      </div>

      {won && <p className="text-center font-bold text-lime-green">Every word found! 🎉</p>}

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
