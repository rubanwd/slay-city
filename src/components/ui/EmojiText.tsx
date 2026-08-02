"use client";

import { useState } from "react";
import twemoji from "@twemoji/api";

function splitGraphemes(value: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(value), (s) => s.segment);
  }
  return Array.from(value);
}

const ZERO_WIDTH_JOINER = String.fromCharCode(0x200d);
const VARIATION_SELECTOR_16 = new RegExp(String.fromCharCode(0xfe0f), "g");

function codePointFor(glyph: string): string {
  // Mirrors twemoji's own variation-selector handling: keep U+FE0F for ZWJ
  // sequences (it can be load-bearing there), strip it otherwise.
  const normalized = glyph.includes(ZERO_WIDTH_JOINER)
    ? glyph
    : glyph.replace(VARIATION_SELECTOR_16, "");
  return twemoji.convert.toCodePoint(normalized);
}

function EmojiGlyph({ glyph, className }: { glyph: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !twemoji.test(glyph)) {
    return <>{glyph}</>;
  }

  return (
    // Twemoji CDN glyph so pictographs render consistently across iOS and
    // Android instead of relying on whichever emoji font (or lack of one)
    // the device happens to ship.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${twemoji.base}${twemoji.size}/${codePointFor(glyph)}${twemoji.ext}`}
      alt={glyph}
      draggable={false}
      onError={() => setFailed(true)}
      className={["inline-block h-[1em] w-[1em] align-[-0.15em]", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export interface EmojiTextProps {
  value: string;
  className?: string;
  glyphClassName?: string;
}

/**
 * Renders text that may contain emoji, drawing each emoji as a Twemoji image
 * instead of the raw character. Newer or platform-specific emoji (e.g. 🪪)
 * render fine on iOS but fall back to a tofu box on Android devices whose
 * system emoji font hasn't caught up — images sidestep that entirely.
 * Non-emoji characters (spaces, "+", "=", letters…) pass through as plain text.
 */
export default function EmojiText({ value, className, glyphClassName }: EmojiTextProps) {
  return (
    <span className={className}>
      {splitGraphemes(value).map((glyph, index) => (
        <EmojiGlyph key={index} glyph={glyph} className={glyphClassName} />
      ))}
    </span>
  );
}
