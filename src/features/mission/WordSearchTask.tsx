"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { SlayButton } from "@/components/ui";

import type { WordSearchContent } from "./types";

export interface WordSearchTaskProps {
  content: WordSearchContent;
  /**
   * Called when the player moves on. The argument is the share of words found
   * (0–1); the mission still counts as completed, but the reward is scaled by
   * this fraction. Finding every word passes 1.
   */
  onComplete: (rewardFraction?: number) => void;
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

const HINT_TEXT =
  "Words are hidden horizontally, vertically, and diagonally — and can read forwards or backwards. Tap the first letter of a word, then tap its last letter.";

const TOOLTIP_WIDTH = 256; // px — matches w-64
const VIEWPORT_MARGIN = 16; // px — keeps the tooltip clear of the screen edge

/**
 * A small "?" icon beside the prompt that toggles a how-to-play tooltip.
 *
 * The icon isn't pinned to a screen edge (the prompt above it varies in
 * length), so the tooltip is positioned in viewport coordinates — measured
 * from the button and clamped to stay fully on-screen — rather than centered
 * on the button itself, which could push it half off-screen.
 */
function HintButton() {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (btnRef.current?.contains(target) || tooltipRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) {
        const left = Math.min(
          Math.max(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, VIEWPORT_MARGIN),
          window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN
        );
        setCoords({ top: rect.bottom + 8, left });
      }
    }
    setOpen((prev) => !prev);
  };

  return (
    <div className="shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label="How to play"
        aria-expanded={open}
        className={[
          "flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
          open
            ? "border-cyan bg-cyan/15 text-cyan"
            : "border-white/20 text-white/70 hover:bg-white/10 hover:text-white",
        ].join(" ")}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M6 6a2 2 0 1 1 2.6 1.9c-.4.15-.6.5-.6.9v.7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="11.6" r="0.95" fill="currentColor" />
        </svg>
      </button>

      {open && coords && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            style={{ top: coords.top, left: coords.left, width: TOOLTIP_WIDTH }}
            className="fixed z-30 rounded-2xl border border-white/15 bg-[#1a1a1a] p-4 shadow-xl shadow-black/50"
          >
            <p className="mb-1.5 text-label uppercase tracking-widest text-cyan">How to play</p>
            <p className="text-small leading-relaxed text-white/80">{HINT_TEXT}</p>
          </div>,
          document.body
        )}
    </div>
  );
}

/**
 * A word-search puzzle. The student taps the first and last letter of a word; if
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

  const total = placed.length;
  const won = found.size === total && total > 0;
  const rewardFraction = total > 0 ? found.size / total : 1;

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
      <div className="flex items-center justify-center gap-2">
        <p className="text-center text-base font-semibold text-white sm:text-lg">{prompt}</p>
        <HintButton />
      </div>

      <div
        className="mx-auto grid w-full max-w-sm gap-1"
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
                  "flex aspect-square items-center justify-center rounded-md text-base font-black uppercase transition-colors sm:text-lg",
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

      {won ? (
        <p className="text-center font-bold text-lime-green">Every word found! 🎉</p>
      ) : (
        <p className="text-center text-small text-white/60">
          Found {found.size} of {total}. Finish now to keep going — you&apos;ll earn a reward for the
          words you found.
        </p>
      )}

      <SlayButton
        variant="green"
        size="lg"
        className="w-full"
        onClick={() => onComplete(rewardFraction)}
      >
        {won ? actionLabel : `${actionLabel} (${found.size}/${total})`}
      </SlayButton>
    </div>
  );
}
