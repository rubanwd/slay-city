"use client";

import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";

export interface RewardModalProps {
  open: boolean;
  onClose: () => void;
  /** Large headline, e.g. "AMAZING!" */
  title: ReactNode;
  /** Reward graphic — pass an <img> or emoji wrapper */
  image?: ReactNode;
  /** Supporting copy below the title */
  description?: ReactNode;
  /** Reward chips row (coins, XP, etc.) */
  rewards?: ReactNode;
  /** Primary CTA — defaults to a "Continue" button if omitted */
  action?: ReactNode;
}

export default function RewardModal({
  open,
  onClose,
  title,
  image,
  description,
  rewards,
  action,
}: RewardModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  /* ── Focus trap & scroll lock ─────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;

    const prev = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();

      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
      prev?.focus();
    };
  }, [open, onClose]);

  const handleBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reward"
      onClick={handleBackdrop}
      className={[
        "fixed inset-0 z-50 flex items-center justify-center px-5",
        "bg-black/75 backdrop-blur-sm",
        "transition-opacity duration-300",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      {/* Panel */}
      <div
        ref={panelRef}
        className={[
          "relative w-full max-w-sm flex flex-col items-center text-center",
          "bg-[#1a1a1a] rounded-3xl border border-neon-pink/50",
          "shadow-[0_0_40px_8px_rgba(255,45,142,0.3)]",
          "px-6 pt-12 pb-8 gap-4",
          "transition-all duration-300",
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-6",
        ].join(" ")}
      >
        {/* Close button */}
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close reward"
          className={[
            "absolute top-4 right-4",
            "w-8 h-8 flex items-center justify-center rounded-full",
            "text-white/40 hover:text-white hover:bg-white/10",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink",
          ].join(" ")}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Neon top accent line */}
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-neon-pink to-transparent" />

        {/* Image slot */}
        {image && (
          <div
            className={[
              "w-36 h-36 rounded-2xl overflow-hidden flex items-center justify-center",
              "bg-gradient-to-br from-purple/30 to-neon-pink/20",
              "ring-2 ring-neon-pink/30",
              "transition-transform duration-500",
              open ? "scale-100" : "scale-75",
            ].join(" ")}
          >
            {image}
          </div>
        )}

        {/* Title */}
        <h2 className="text-display font-black text-white leading-none tracking-tight">
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p className="text-body text-white/60 max-w-xs">{description}</p>
        )}

        {/* Reward chips */}
        {rewards && <div className="flex items-center gap-3">{rewards}</div>}

        {/* Divider */}
        <div className="w-full h-px bg-white/10" />

        {/* Action */}
        <div className="w-full">
          {action ?? (
            <button
              onClick={onClose}
              className={[
                "w-full h-13 rounded-2xl",
                "bg-neon-pink text-white font-extrabold tracking-wide uppercase",
                "hover:brightness-110 active:brightness-90",
                "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              ].join(" ")}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
