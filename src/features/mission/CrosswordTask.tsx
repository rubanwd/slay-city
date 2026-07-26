"use client";

import { useMemo, useState } from "react";

import { SlayButton } from "@/components/ui";

import type { CrosswordContent, CrosswordEntry } from "./types";

export interface CrosswordTaskProps {
  content: CrosswordContent;
  onComplete: () => void;
  actionLabel?: string;
}

const cellKey = (r: number, c: number) => `${r},${c}`;

interface BuiltGrid {
  cells: Map<string, { letter: string }>;
  numbers: Map<string, number>;
  rows: number;
  cols: number;
  clues: { across: NumberedEntry[]; down: NumberedEntry[] };
}

interface NumberedEntry extends CrosswordEntry {
  number: number;
}

function entryCells(entry: CrosswordEntry): { r: number; c: number }[] {
  return entry.answer.split("").map((_, k) => ({
    r: entry.row + (entry.direction === "down" ? k : 0),
    c: entry.col + (entry.direction === "across" ? k : 0),
  }));
}

/** Lays out cells from entry coordinates and assigns standard crossword numbers. */
function buildGrid(entries: CrosswordEntry[]): BuiltGrid {
  const cells = new Map<string, { letter: string }>();
  let rows = 0;
  let cols = 0;

  entries.forEach((entry) => {
    entryCells(entry).forEach((cell, k) => {
      cells.set(cellKey(cell.r, cell.c), { letter: entry.answer[k] });
      rows = Math.max(rows, cell.r + 1);
      cols = Math.max(cols, cell.c + 1);
    });
  });

  // Number the start cells in reading order (top-to-bottom, left-to-right).
  const starts = new Set(entries.map((e) => cellKey(e.row, e.col)));
  const numbers = new Map<string, number>();
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = cellKey(r, c);
      if (starts.has(key)) numbers.set(key, ++n);
    }
  }

  const numbered = entries.map<NumberedEntry>((e) => ({
    ...e,
    number: numbers.get(cellKey(e.row, e.col)) ?? 0,
  }));

  return {
    cells,
    numbers,
    rows,
    cols,
    clues: {
      across: numbered.filter((e) => e.direction === "across").sort((a, b) => a.number - b.number),
      down: numbered.filter((e) => e.direction === "down").sort((a, b) => a.number - b.number),
    },
  };
}

/**
 * A small crossword. The student types letters into the numbered grid using the
 * across/down clues, then checks the solution. Correct cells lock in green;
 * wrong ones flash until edited. The task advances when the whole grid is right.
 */
export default function CrosswordTask({
  content,
  onComplete,
  actionLabel = "Next",
}: CrosswordTaskProps) {
  const { prompt, entries } = content;
  const { cells, numbers, rows, cols, clues } = useMemo(() => buildGrid(entries), [entries]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const allCorrect = useMemo(
    () => [...cells.entries()].every(([key, cell]) => (values[key] ?? "") === cell.letter),
    [cells, values]
  );

  const setCell = (key: string, raw: string) => {
    const char = raw.slice(-1).toUpperCase();
    setValues((prev) => ({ ...prev, [key]: char }));
    setChecked(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-center text-h3 font-semibold text-white">{prompt}</p>

      <div className="overflow-x-auto">
        <div
          className="mx-auto grid w-fit gap-0.5"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: rows * cols }, (_, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;
            const key = cellKey(r, c);
            const cell = cells.get(key);
            if (!cell) return <div key={key} className="h-9 w-9" />;

            const value = values[key] ?? "";
            const number = numbers.get(key);
            const isWrong = checked && value !== cell.letter;
            const isRight = checked && value === cell.letter;
            return (
              <div key={key} className="relative h-9 w-9">
                {number && (
                  <span className="absolute left-0.5 top-0 z-10 text-[8px] font-bold text-white/60">
                    {number}
                  </span>
                )}
                <input
                  value={value}
                  onChange={(e) => setCell(key, e.target.value)}
                  inputMode="text"
                  autoCapitalize="characters"
                  aria-label={`Row ${r + 1} column ${c + 1}`}
                  className={[
                    "h-full w-full rounded-[3px] border text-center text-body-strong font-black uppercase caret-neon-pink focus:outline-none focus:ring-2 focus:ring-cyan",
                    isWrong
                      ? "border-neon-pink bg-neon-pink/15 text-neon-pink"
                      : isRight
                        ? "border-lime-green bg-lime-green/15 text-lime-green"
                        : "border-white/25 bg-white/10 text-white",
                  ].join(" ")}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ClueList title="Across" entries={clues.across} />
        <ClueList title="Down" entries={clues.down} />
      </div>

      {checked && !allCorrect && (
        <p className="text-center font-bold text-neon-pink">Not quite — check the red cells.</p>
      )}

      {allCorrect ? (
        <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete}>
          {actionLabel}
        </SlayButton>
      ) : (
        <SlayButton variant="pink" size="lg" className="w-full" onClick={() => setChecked(true)}>
          Check
        </SlayButton>
      )}
    </div>
  );
}

function ClueList({ title, entries }: { title: string; entries: NumberedEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label uppercase tracking-widest text-white/50">{title}</span>
      <ul className="flex flex-col gap-1">
        {entries.map((entry) => (
          <li key={`${entry.number}-${entry.direction}`} className="text-small text-white/80">
            <span className="font-bold text-white">{entry.number}.</span> {entry.clue}
          </li>
        ))}
      </ul>
    </div>
  );
}
