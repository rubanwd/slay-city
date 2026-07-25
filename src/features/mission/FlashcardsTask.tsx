"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

import { SlayButton } from "@/components/ui";

import type { FlashcardsContent } from "./types";

export interface FlashcardsTaskProps {
  content: FlashcardsContent;
  onComplete: () => void;
  actionLabel?: string;
}

const TURN_MS = 260;

type Phase = "idle" | "out" | "jump" | "in";

/**
 * A self-paced review deck. The student taps a card to flip between its front and
 * back, then steps through every card. The advance button only finishes the task
 * once the last card has been reached.
 *
 * The flip never rotates past 90deg in either direction: it turns to 90deg,
 * swaps the face content while the card is edge-on (and so invisible), then
 * turns from -90deg back to 0. This sidesteps `backface-visibility`, which
 * some mobile WebViews flatten to a plain 2D mirror instead of hiding —
 * leaving both faces visible and overlapping at once.
 */
export default function FlashcardsTask({
  content,
  onComplete,
  actionLabel = "Next",
}: FlashcardsTaskProps) {
  const { prompt, cards } = content;

  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<"front" | "back">("front");
  const [phase, setPhase] = useState<Phase>("idle");
  const reducedMotion = useRef(false);
  const timers = useRef<number[]>([]);
  const frames = useRef<number[]>([]);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timerIds = timers.current;
    const frameIds = frames.current;
    return () => {
      timerIds.forEach((id) => window.clearTimeout(id));
      frameIds.forEach((id) => window.cancelAnimationFrame(id));
    };
  }, []);

  const card = cards[index];
  const isLast = index === cards.length - 1;

  const flip = () => {
    if (phase !== "idle") return;

    if (reducedMotion.current) {
      setSide((s) => (s === "front" ? "back" : "front"));
      return;
    }

    setPhase("out");
    timers.current.push(
      window.setTimeout(() => {
        setSide((s) => (s === "front" ? "back" : "front"));
        setPhase("jump");
        frames.current.push(
          window.requestAnimationFrame(() => {
            frames.current.push(
              window.requestAnimationFrame(() => {
                setPhase("in");
                timers.current.push(window.setTimeout(() => setPhase("idle"), TURN_MS));
              }),
            );
          }),
        );
      }, TURN_MS),
    );
  };

  const advance = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((i) => i + 1);
    setSide("front");
    setPhase("idle");
  };

  const angle = phase === "out" ? 90 : phase === "jump" ? -90 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white">{prompt}</p>
        <span className="text-small font-bold text-white/50">
          {index + 1}/{cards.length}
        </span>
      </div>

      <button
        type="button"
        onClick={flip}
        aria-label={side === "front" ? "Show the answer" : "Show the front of the card"}
        className="flip-card-scene relative min-h-[16rem] w-full"
      >
        <div
          className="relative h-full min-h-[16rem] w-full"
          style={{
            transform: `rotateY(${angle}deg)`,
            transition: phase === "jump" ? "none" : `transform ${TURN_MS}ms ease`,
          }}
        >
          {side === "front" ? (
            <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border-2 border-cyan bg-gradient-to-br from-cyan/25 via-black to-purple/25 p-6 text-center shadow-[0_0_40px_-10px_rgba(0,240,255,0.5)]">
              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -right-12 h-44 w-44 rounded-full bg-purple/30 blur-3xl" />
              {card.imageUrl && (
                <div className="relative z-10 h-28 w-28 overflow-hidden rounded-2xl bg-white/5">
                  <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <span className="relative z-10 text-h1 font-black text-white">{card.front}</span>
              <span className="relative z-10 text-label uppercase tracking-widest text-white/40">
                Tap to flip
              </span>
            </div>
          ) : (
            <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border-2 border-lime-green bg-gradient-to-br from-lime-green/25 via-black to-neon-pink/25 p-6 text-center shadow-[0_0_40px_-10px_rgba(157,255,0,0.5)]">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lime-green/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-neon-pink/30 blur-3xl" />
              <span className="relative z-10 text-h1 font-black text-white">{card.back}</span>
              <span className="relative z-10 text-label uppercase tracking-widest text-white/40">
                Answer
              </span>
            </div>
          )}
        </div>
      </button>

      <SlayButton variant="green" size="lg" className="w-full" onClick={advance}>
        {isLast ? actionLabel : "Next card"}
      </SlayButton>
    </div>
  );
}
