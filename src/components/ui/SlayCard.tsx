"use client";

import { type HTMLAttributes, type ReactNode, forwardRef } from "react";

export type SlayCardVariant = "pink" | "green" | "cyan" | "purple" | "ghost";

export interface SlayCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Border and glow color. "ghost" = subtle white border, no glow. */
  variant?: SlayCardVariant;
  /** Scale + intensify glow on hover. */
  hoverable?: boolean;
  /** Remove internal padding — useful for full-bleed media cards. */
  flush?: boolean;
  children: ReactNode;
}

/* ── Per-variant border + glow shadow ──────────────────────────────────────── */
const VARIANT: Record<SlayCardVariant, { border: string; shadow: string; hoverShadow: string }> = {
  pink: {
    border: "border-neon-pink/60",
    shadow: "shadow-[0_0_12px_0_rgba(255,45,142,0.25)]",
    hoverShadow: "hover:shadow-[0_0_24px_4px_rgba(255,45,142,0.45)] hover:border-neon-pink",
  },
  green: {
    border: "border-lime-green/60",
    shadow: "shadow-[0_0_12px_0_rgba(157,255,0,0.20)]",
    hoverShadow: "hover:shadow-[0_0_24px_4px_rgba(157,255,0,0.40)] hover:border-lime-green",
  },
  cyan: {
    border: "border-cyan/60",
    shadow: "shadow-[0_0_12px_0_rgba(0,240,255,0.20)]",
    hoverShadow: "hover:shadow-[0_0_24px_4px_rgba(0,240,255,0.40)] hover:border-cyan",
  },
  purple: {
    border: "border-purple/60",
    shadow: "shadow-[0_0_12px_0_rgba(106,0,255,0.25)]",
    hoverShadow: "hover:shadow-[0_0_24px_4px_rgba(106,0,255,0.45)] hover:border-purple",
  },
  ghost: {
    border: "border-white/15",
    shadow: "",
    hoverShadow: "hover:border-white/40 hover:bg-white/5",
  },
};

/* ── Root card ──────────────────────────────────────────────────────────────── */
const SlayCard = forwardRef<HTMLDivElement, SlayCardProps>(function SlayCard(
  { variant = "pink", hoverable = false, flush = false, children, className = "", ...rest },
  ref
) {
  const v = VARIANT[variant];

  return (
    <div
      ref={ref}
      className={[
        // Base
        "relative flex flex-col bg-[#1a1a1a] rounded-2xl border overflow-hidden",
        // Padding
        flush ? "" : "p-4 sm:p-5",
        // Transition
        "transition-all duration-200",
        // Variant
        v.border,
        v.shadow,
        // Hover
        hoverable ? ["cursor-pointer", "hover:scale-[1.02]", v.hoverShadow].join(" ") : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
});

/* ── SlayCard.Header ────────────────────────────────────────────────────────── */
interface SlayCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds a bottom border separator */
  divided?: boolean;
}

function SlayCardHeader({ children, divided = false, className = "", ...rest }: SlayCardHeaderProps) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-2",
        divided ? "pb-3 mb-3 border-b border-white/10" : "mb-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── SlayCard.Content ───────────────────────────────────────────────────────── */
interface SlayCardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function SlayCardContent({ children, className = "", ...rest }: SlayCardContentProps) {
  return (
    <div className={["flex-1 min-w-0", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

/* ── SlayCard.Footer ────────────────────────────────────────────────────────── */
interface SlayCardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds a top border separator */
  divided?: boolean;
}

function SlayCardFooter({ children, divided = false, className = "", ...rest }: SlayCardFooterProps) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-2",
        divided ? "pt-3 mt-3 border-t border-white/10" : "mt-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── Attach sub-components ──────────────────────────────────────────────────── */
const SlayCardNamespace = Object.assign(SlayCard, {
  Header: SlayCardHeader,
  Content: SlayCardContent,
  Footer: SlayCardFooter,
});

export default SlayCardNamespace;
