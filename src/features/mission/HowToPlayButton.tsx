"use client";

import { useEffect, useRef, useState } from "react";

export interface HowToPlayButtonProps {
  /** The "how to play" text for the current task. */
  text: string;
}

/**
 * A small "i" button in the mission header. Tapping it toggles a tooltip with
 * the current task's instructions; it dismisses on an outside tap or Escape.
 * Rendered once in the header, it covers every task type via the text passed in.
 */
export default function HowToPlayButton({ text }: HowToPlayButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
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

  if (!text) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="How to play"
        aria-expanded={open}
        className={[
          "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
          open
            ? "border-cyan bg-cyan/15 text-cyan"
            : "border-white/15 text-white/70 hover:bg-white/5 hover:text-white",
        ].join(" ")}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="4.6" r="0.95" fill="currentColor" />
          <path d="M8 7v4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute right-0 top-11 z-30 w-64 rounded-2xl border border-white/15 bg-[#1a1a1a] p-4 shadow-xl shadow-black/50"
        >
          <p className="mb-1.5 text-label uppercase tracking-widest text-cyan">How to play</p>
          <p className="text-small leading-relaxed text-white/80">{text}</p>
        </div>
      )}
    </div>
  );
}
