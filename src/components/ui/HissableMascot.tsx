"use client";

import { playSnakeHiss } from "@/lib/hiss";

export interface HissableMascotProps {
  /** Mascot artwork (default snake, or the currently equipped item's preview). */
  src: string;
  /** Classes for the mascot image — sizing and animation differ per surface. */
  imageClassName: string;
  /** Classes for the ground-shadow pill under the mascot. */
  shadowClassName: string;
  className?: string;
  /** Accessible name for the tap target. */
  label?: string;
}

/**
 * Slay, but tappable: playing a hiss on tap is the cheapest bit of "the mascot
 * is alive" we can give a student on screens where there is nothing else to do
 * (the map, and while a route loads). Purely decorative — nothing about the
 * game state changes — so the button carries no other behaviour.
 */
export default function HissableMascot({
  src,
  imageClassName,
  shadowClassName,
  className = "",
  label = "Make Slay hiss",
}: HissableMascotProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        void playSnakeHiss();
      }}
      className={[
        "flex flex-col items-center rounded-full pointer-events-auto",
        "transition-transform duration-150 active:scale-90 motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-green focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- mascot illustration (static or uploaded item art) */}
      <img src={src} alt="" aria-hidden="true" className={imageClassName} />
      <span aria-hidden="true" className={shadowClassName} />
    </button>
  );
}
