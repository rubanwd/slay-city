"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { SlayButton } from "@/components/ui";

import {
  GRID,
  OPPOSITE,
  cellKey as key,
  nextHead,
  type Cell,
  type Direction,
} from "./snakeGrid";
import type { SnakeGameContent } from "./types";

export interface SnakeGameTaskProps {
  content: SnakeGameContent;
  onComplete: () => void;
  actionLabel?: string;
}

const TICK_MS = 260;
/** Wrong-letter flash duration, in game ticks. */
const FLASH_TICKS = 2;

type Status = "idle" | "playing" | "dead" | "won";

interface LetterCell extends Cell {
  char: string;
}

interface GameState {
  snake: Cell[];
  direction: Direction;
  letters: LetterCell[];
  collected: number;
  status: Status;
  /** Ticks remaining on the wrong-letter flash; counts down in the game loop. */
  flashTicks: number;
}

const INITIAL_SNAKE: Cell[] = [
  { x: 5, y: 6 },
  { x: 4, y: 6 },
  { x: 3, y: 6 },
];

/** Picks `count` random cells that aren't already occupied by the snake. */
function randomFreeCells(occupied: Cell[], count: number): Cell[] {
  const taken = new Set(occupied.map(key));
  const free: Cell[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [free[i], free[j]] = [free[j], free[i]];
  }
  return free.slice(0, count);
}

/**
 * Scatters every letter of the word across the board at once. Nothing marks
 * which one comes next — the child reads that off the word above the board.
 */
function spawnLetters(snake: Cell[], word: string): LetterCell[] {
  const cells = randomFreeCells(snake, word.length);
  return cells.map((cell, index) => ({ ...cell, char: word[index] }));
}

function createGame(word: string, status: Status): GameState {
  return {
    snake: INITIAL_SNAKE,
    direction: "right",
    letters: spawnLetters(INITIAL_SNAKE, word),
    collected: 0,
    status,
    flashTicks: 0,
  };
}

/**
 * A Snake mini-game where every letter of the authored word is scattered on the
 * board at once and the child collects them in order, reading the next one off
 * the word above. Taking a letter clears it from both the board and the word;
 * taking one out of order only costs a flash. Running into the snake's own body
 * ends the run and restarts the word, while edges wrap, so self-collision is the
 * one fatal mistake. The board is a square grid above an on-screen D-pad so the
 * whole game fits a portrait phone without scrolling.
 */
export default function SnakeGameTask({
  content,
  onComplete,
  actionLabel = "Next",
}: SnakeGameTaskProps) {
  const { word, translation, prompt } = content;

  const [game, setGame] = useState<GameState>(() => createGame(word, "idle"));

  // Queued turns, so two taps within one tick don't collapse into a single turn
  // (which would let the snake reverse into its own neck).
  const turnQueue = useRef<Direction[]>([]);
  // Read by `turn`, which must not touch state to decide whether a turn is legal.
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const reset = useCallback(
    (status: Status) => {
      turnQueue.current = [];
      setGame(createGame(word, status));
    },
    [word]
  );

  const turn = useCallback((direction: Direction) => {
    if (gameRef.current.status !== "playing") return;
    const last = turnQueue.current.at(-1) ?? gameRef.current.direction;
    if (direction === last || direction === OPPOSITE[last]) return;
    turnQueue.current.push(direction);
  }, []);

  useEffect(() => {
    if (game.status !== "playing") return;

    const id = window.setInterval(() => {
      setGame((prev) => {
        if (prev.status !== "playing") return prev;

        prev = { ...prev, flashTicks: Math.max(0, prev.flashTicks - 1) };
        const direction = turnQueue.current.shift() ?? prev.direction;
        const head = nextHead(prev.snake[0], direction);

        // The tail cell frees up as the snake moves, so it isn't a collision.
        const hitSelf = prev.snake.slice(0, -1).some((cell) => key(cell) === key(head));
        if (hitSelf) return { ...prev, direction, status: "dead" };

        const letter = prev.letters.find((cell) => key(cell) === key(head));

        // Matched by character, not by cell, so a repeated letter (MOON) can be
        // taken from whichever of its copies the snake reaches first.
        if (letter && letter.char === word[prev.collected]) {
          const collected = prev.collected + 1;
          const snake = [head, ...prev.snake]; // grow: keep the tail
          const letters = prev.letters.filter((cell) => key(cell) !== key(head));
          const status = collected === word.length ? "won" : prev.status;
          return { ...prev, direction, snake, collected, letters, status };
        }

        const snake = [head, ...prev.snake.slice(0, -1)];

        // Out-of-order letter: it stays put and costs only a flash, so a wrong
        // guess never strands the child mid-word.
        if (letter) return { ...prev, direction, snake, flashTicks: FLASH_TICKS };

        return { ...prev, direction, snake };
      });
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [game.status, word]);

  useEffect(() => {
    const KEYS: Record<string, Direction> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = KEYS[event.key];
      if (!direction) return;
      event.preventDefault(); // arrows would otherwise scroll the mission page
      turn(direction);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [turn]);

  const snakeCells = new Map(game.snake.map((cell, index) => [key(cell), index]));
  const letterCells = new Map(game.letters.map((cell) => [key(cell), cell]));

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="shrink-0 flex flex-col items-center gap-0.5 text-center">
        <p className="text-lg leading-tight font-bold text-white">{prompt}</p>
        {translation && <p className="text-base leading-tight text-cyan">{translation}</p>}
      </div>

      {/* Word progress: every letter starts visible, and each one clears as it's collected.
          The next letter to grab gets a glowing highlight so it reads at a glance. */}
      <div className="shrink-0 flex flex-wrap justify-center gap-1.5">
        {word.split("").map((char, index) => {
          const done = index < game.collected;
          const next = index === game.collected;
          return (
            <span
              key={index}
              className={[
                "flex h-10 w-9 items-center justify-center rounded-lg border text-lg font-black transition-colors",
                done
                  ? "border-white/10 bg-white/[0.03]"
                  : next
                    ? "border-lime-green bg-lime-green/15 text-white shadow-[0_0_12px_2px_rgba(157,255,0,0.3)]"
                    : "border-white/15 bg-white/5 text-white",
              ].join(" ")}
            >
              {done ? "" : char}
            </span>
          );
        })}
      </div>

      {/* Square play field — sized to whatever height/width remains, so it
          shrinks to fit rather than pushing the D-pad/button off-screen. */}
      <div className="min-h-0 flex-1 flex items-center justify-center">
        <div
          className={[
            "relative aspect-square h-full max-w-full overflow-hidden rounded-2xl border-2 bg-black/50 shadow-[0_0_24px_rgba(0,0,0,0.45)] transition-colors",
            game.flashTicks > 0
              ? "border-neon-pink shadow-[0_0_20px_4px_rgba(255,45,142,0.35)]"
              : "border-white/20",
          ].join(" ")}
        >
          <div
            className="grid h-full w-full gap-[2px] p-[3px]"
            style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: GRID * GRID }, (_, index) => {
              const cellKey = `${index % GRID},${Math.floor(index / GRID)}`;
              const snakeIndex = snakeCells.get(cellKey);
              const letter = letterCells.get(cellKey);

              if (snakeIndex !== undefined) {
                return (
                  <div
                    key={index}
                    className={[
                      "rounded-[3px]",
                      snakeIndex === 0
                        ? "bg-lime-green shadow-[0_0_6px_1px_rgba(157,255,0,0.7)]"
                        : "bg-lime-green/60",
                    ].join(" ")}
                  />
                );
              }

              if (letter) {
                return (
                  <div
                    key={index}
                    className="flex items-center justify-center rounded-[3px] border border-cyan/40 bg-cyan/20 text-[11px] leading-none font-black text-white"
                  >
                    {letter.char}
                  </div>
                );
              }

              return <div key={index} className="rounded-[3px] bg-white/[0.04]" />;
            })}
          </div>
        </div>
      </div>

      {/* D-pad */}
      <div className="shrink-0 mx-auto grid w-48 grid-cols-3 grid-rows-3 gap-2">
        <DPadButton direction="up" label="▲" className="col-start-2 row-start-1" onPress={turn} />
        <DPadButton direction="left" label="◀" className="col-start-1 row-start-2" onPress={turn} />
        <DPadButton direction="right" label="▶" className="col-start-3 row-start-2" onPress={turn} />
        <DPadButton direction="down" label="▼" className="col-start-2 row-start-3" onPress={turn} />
      </div>

      {/* Ready / Game Over / Won states take over the whole screen behind a
          heavy blur, instead of a small box confined to the board, so the
          child's focus goes straight to the one thing they can do next. */}
      {game.status !== "playing" && typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 backdrop-blur-xl"
          >
            <div
              className={[
                "flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border-2 bg-[#161616] px-6 py-8 text-center shadow-2xl",
                game.status === "dead" &&
                  "border-neon-pink/60 shadow-[0_0_50px_10px_rgba(255,45,142,0.3)]",
                game.status === "won" &&
                  "border-lime-green/60 shadow-[0_0_50px_10px_rgba(157,255,0,0.3)]",
                game.status === "idle" && "border-cyan/50 shadow-[0_0_50px_10px_rgba(0,229,255,0.2)]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {game.status === "idle" && (
                <>
                  <p className="text-3xl font-black text-white">Ready?</p>
                  <p className="text-base leading-relaxed text-white/75">
                    All the letters are on the board. Eat them in the word&apos;s order, avoid
                    your own tail, and you can pass through the edges.
                  </p>
                  <SlayButton variant="green" size="lg" className="w-full" onClick={() => reset("playing")}>
                    Start
                  </SlayButton>
                </>
              )}
              {game.status === "dead" && (
                <>
                  <p className="text-2xl font-black text-neon-pink">Oops! Game over.</p>
                  <SlayButton variant="pink" size="lg" className="w-full" onClick={() => reset("playing")}>
                    Try Again
                  </SlayButton>
                </>
              )}
              {game.status === "won" && (
                <>
                  <p className="text-3xl font-black text-lime-green">{word}</p>
                  <p className="text-base text-white/75">You collected every letter!</p>
                  <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete}>
                    {actionLabel}
                  </SlayButton>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function DPadButton({
  direction,
  label,
  className,
  onPress,
}: {
  direction: Direction;
  label: string;
  className: string;
  onPress: (direction: Direction) => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction}
      // Pointer events keep the D-pad responsive on touch, where the synthetic
      // click lands ~300ms late.
      onPointerDown={(event) => {
        event.preventDefault();
        onPress(direction);
      }}
      className={`flex h-14 w-14 touch-none items-center justify-center rounded-xl border border-white/20 bg-white/[0.07] text-lg text-white/90 transition-colors select-none hover:border-cyan/60 hover:bg-cyan/10 active:bg-cyan/20 focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none ${className}`}
    >
      {label}
    </button>
  );
}
