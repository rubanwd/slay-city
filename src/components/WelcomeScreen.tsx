"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppContainer, Section } from "@/components/layout";

/* ── Typewriter subtitle ────────────────────────────────────────────────── */

interface SubtitlePart {
  text: string;
  className: string;
}

/** Rendered as two lines: line 1 is its own part list, line 2 is the rest. */
const SUBTITLE_LINE_1: SubtitlePart[] = [{ text: "Learn English.", className: "text-white/70" }];
const SUBTITLE_LINE_2: SubtitlePart[] = [
  { text: "Slay", className: "text-lime-green" },
  { text: " your goals.", className: "text-white/70" },
];
const SUBTITLE_LENGTH = [...SUBTITLE_LINE_1, ...SUBTITLE_LINE_2].reduce(
  (sum, part) => sum + part.text.length,
  0
);

/** Reveals `total` characters one at a time, starting after `delay` ms. */
function useTypewriter(total: number, speed = 45, delay = 350) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setRevealed((prev) => {
          const next = prev + 1;
          if (next >= total) clearInterval(intervalId);
          return next;
        });
      }, speed);
    }, delay);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [total, speed, delay]);

  return revealed;
}

/** Slices `parts` down to `budget` visible characters, in reading order. */
function renderTypedParts(parts: SubtitlePart[], budget: number, consumedBefore: number) {
  let consumed = consumedBefore;
  return parts.map((part, index) => {
    const remaining = Math.max(0, budget - consumed);
    const visible = part.text.slice(0, remaining);
    consumed += part.text.length;
    return (
      <span key={index} className={part.className}>
        {visible}
      </span>
    );
  });
}

/* ── Decorative inline icons — one-off, brand-specific, not worth a shared
   icon library for a single screen. ──────────────────────────────────────── */

function LightningIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5 2.3-7.2-6-4.6h7.6z" />
    </svg>
  );
}

function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 20s-7.5-4.7-10-9.3C.4 7.4 2.2 4 5.6 4c2 0 3.5 1.1 4.4 2.6C10.9 5.1 12.4 4 14.4 4c3.4 0 5.2 3.4 3.6 6.7C20 15.3 12 20 12 20z" />
    </svg>
  );
}

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WelcomeScreen() {
  const revealed = useTypewriter(SUBTITLE_LENGTH);

  return (
    <AppContainer>
      <Section py="lg" className="gap-2 items-start text-left">
        <div className="relative self-start -ml-2 h-14 w-auto">
          {/* eslint-disable-next-line @next/next/no-img-element -- local static brand logo */}
          <img src="/logo.svg" alt="Slay" className="block h-14 w-auto" />
          <span aria-hidden="true" className="absolute inset-0 logo-shimmer" />
        </div>

        <p className="relative text-sm font-semibold uppercase tracking-wide leading-relaxed">
          {/* Invisible full text reserves the two-line height up front, so the
             layout below never shifts as the typewriter reveals characters. */}
          <span aria-hidden="true" className="invisible block">
            <span className="block">{renderTypedParts(SUBTITLE_LINE_1, SUBTITLE_LENGTH, 0)}</span>
            <span className="block">
              {renderTypedParts(SUBTITLE_LINE_2, SUBTITLE_LENGTH, SUBTITLE_LINE_1[0].text.length)}
            </span>
          </span>
          <span className="absolute inset-0 block">
            <span className="block">{renderTypedParts(SUBTITLE_LINE_1, revealed, 0)}</span>
            <span className="block">
              {renderTypedParts(SUBTITLE_LINE_2, revealed, SUBTITLE_LINE_1[0].text.length)}
            </span>
          </span>
        </p>
      </Section>

      <div className="flex-1 flex flex-col justify-center gap-8">
        <div className="relative mx-auto w-full max-w-[280px]">
          <LightningIcon className="text-lime-green absolute -top-8 left-2" />

          <div className="relative rounded-3xl bg-gradient-to-b from-purple/20 via-black to-black p-3 animate-glow">
            {/* eslint-disable-next-line @next/next/no-img-element -- local static placeholder illustration */}
            <img
              src="/mascot-slay.svg"
              alt="Slay City mascot — a snake wearing headphones and a hoodie"
              className="w-full aspect-square object-contain"
            />

            <StarIcon className="text-neon-pink absolute -top-3 -right-3" />
            <HeartIcon className="text-neon-pink absolute -bottom-3 -left-3" />
            <SparkleIcon className="text-cyan absolute bottom-3 right-3" />
          </div>
        </div>
      </div>

      <Section py="lg" className="gap-4">
        <Link
          href="/auth/login"
          className={[
            "inline-flex items-center justify-center gap-2.5 w-full h-16 px-8 rounded-2xl",
            "font-extrabold uppercase tracking-wide text-lg",
            "bg-lime-green text-black",
            "hover:brightness-110 active:brightness-90 transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-green focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          ].join(" ")}
        >
          Let&apos;s Go!
          <ChevronIcon />
        </Link>
      </Section>
    </AppContainer>
  );
}
