"use client";

import { useEffect, useRef, useState } from "react";

export type StreakBadgeSize = "sm" | "md" | "lg";

export interface StreakBadgeProps {
  count: number;
  size?: StreakBadgeSize;
  /** Override the default tooltip text */
  tooltip?: string;
  className?: string;
}

const SIZE: Record<StreakBadgeSize, { wrap: string; icon: string; count: string }> = {
  sm: { wrap: "h-7 px-2.5 gap-1 rounded-xl",   icon: "text-base",   count: "text-sm font-black"  },
  md: { wrap: "h-10 px-4   gap-1.5 rounded-2xl", icon: "text-xl",    count: "text-base font-black" },
  lg: { wrap: "h-14 px-5   gap-2 rounded-2xl",   icon: "text-2xl",   count: "text-xl font-black"  },
};

/** Counts up from `from` to `to` over `duration` ms */
function useCountUp(to: number, duration = 600) {
  const [display, setDisplay] = useState(to);
  const prev = useRef(to);

  useEffect(() => {
    const from = prev.current;
    prev.current = to;
    if (from === to) return;

    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return display;
}

export default function StreakBadge({
  count,
  size = "md",
  tooltip,
  className = "",
}: StreakBadgeProps) {
  const display = useCountUp(count);
  const s = SIZE[size];
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };
  const hide = () => {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  const tip =
    tooltip ??
    `${count}-day streak! Log in and complete at least one mission every day to keep it going.`;

  return (
    <div className={["relative inline-flex", className].filter(Boolean).join(" ")}>
      {/* Badge */}
      <button
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-label={`${count} day streak`}
        aria-describedby="streak-tooltip"
        className={[
          "inline-flex items-center cursor-default select-none",
          "bg-gradient-to-r from-purple to-cyan",
          "text-white",
          // Subtle inner glow
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_12px_2px_rgba(106,0,255,0.35)]",
          "transition-shadow duration-200",
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_20px_4px_rgba(0,240,255,0.35)]",
          s.wrap,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className={s.icon} aria-hidden="true">🔥</span>
        <span className={s.count}>{display}</span>
      </button>

      {/* Tooltip */}
      <div
        id="streak-tooltip"
        role="tooltip"
        className={[
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
          "w-56 px-3 py-2 rounded-xl",
          "bg-[#1a1a1a] border border-white/10",
          "text-small text-white/80 text-center leading-snug",
          "pointer-events-none",
          "transition-all duration-150",
          open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {tip}
        {/* Arrow */}
        <span
          className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/10"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
