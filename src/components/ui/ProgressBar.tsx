"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

export type ProgressBarVariant = "green" | "pink" | "cyan";

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  variant?: ProgressBarVariant;
  /** Height of the track in px */
  height?: number;
  /** Optional label rendered above the bar */
  label?: ReactNode;
  /** Optional right-aligned label (e.g. "450 / 1000 XP") */
  labelRight?: ReactNode;
  /** Animate fill on mount */
  animate?: boolean;
  className?: string;
}

const FILL: Record<ProgressBarVariant, { bg: string; glow: string }> = {
  green: {
    bg: "bg-lime-green",
    glow: "shadow-[0_0_8px_2px_rgba(157,255,0,0.5)]",
  },
  pink: {
    bg: "bg-neon-pink",
    glow: "shadow-[0_0_8px_2px_rgba(255,45,142,0.5)]",
  },
  cyan: {
    bg: "bg-cyan",
    glow: "shadow-[0_0_8px_2px_rgba(0,240,255,0.5)]",
  },
};

export default function ProgressBar({
  value,
  variant = "green",
  height = 10,
  label,
  labelRight,
  animate = true,
  className = "",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const { bg, glow } = FILL[variant];

  // Start at 0 on mount so the CSS transition plays
  const [displayed, setDisplayed] = useState(animate ? 0 : clamped);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (animate) {
        // Next frame — guarantees the transition fires
        const id = requestAnimationFrame(() => setDisplayed(clamped));
        return () => cancelAnimationFrame(id);
      }
    } else {
      setDisplayed(clamped);
    }
  }, [clamped, animate]);

  const hasLabels = label != null || labelRight != null;

  return (
    <div className={["flex flex-col gap-1.5 w-full", className].filter(Boolean).join(" ")}>
      {hasLabels && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className="text-label font-bold tracking-widest text-white/50 uppercase">
              {label}
            </span>
          )}
          {labelRight && (
            <span className="text-small font-semibold text-white/70 ml-auto">{labelRight}</span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full overflow-hidden rounded-full bg-white/10"
        style={{ height }}
      >
        {/* Fill */}
        <div
          className={["h-full rounded-full", bg, clamped > 0 ? glow : ""].filter(Boolean).join(" ")}
          style={{
            width: `${displayed}%`,
            transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
