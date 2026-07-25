"use client";

import { useEffect } from "react";

import { ROTATE_MESSAGES } from "@/components/rotateMessages";
import type { Locale } from "@/features/i18n/locales";

/**
 * Keeps the game in portrait.
 *
 * Every screen is built mobile-first around a tall 390px frame — the map's
 * aspect-ratio window, the full-height mission flow — so a phone turned
 * sideways renders artwork cropped and layouts squashed. Three layers stop
 * that, because no single one covers every browser:
 *
 * 1. `manifest.json` declares `"orientation": "portrait"`, which an installed
 *    PWA on Android obeys on its own.
 * 2. `screen.orientation.lock()` asks for the same thing at runtime, for
 *    Chromium in standalone/fullscreen. It rejects everywhere else (Safari has
 *    no implementation at all, and a browser tab isn't allowed to lock), which
 *    is expected, not an error worth surfacing.
 * 3. When neither took — iOS Safari, most notably, where a rotation lock is
 *    simply not offered to web apps — this overlay covers the app and asks for
 *    the phone back. Its visibility is pure CSS (`.portrait-lock`, see
 *    `globals.css`): a landscape viewport short enough to be a phone, on a
 *    touch device. Tablets and desktop never see it.
 *
 * The overlay is in the server-rendered HTML — hence `locale` as a prop rather
 * than a browser lookup — so a phone that loads the app *already* sideways is
 * covered by the first paint, not a beat later once React has hydrated.
 */
export function PortraitLock({ locale }: { locale: Locale }) {
  useEffect(() => {
    const orientation = window.screen?.orientation as
      | (ScreenOrientation & { lock?: (orientation: "portrait") => Promise<void> })
      | undefined;
    // Rejects unless the app is installed/fullscreen on a browser that
    // implements it — in which case the overlay below is the fallback.
    orientation?.lock?.("portrait").catch(() => {});
  }, []);

  const messages = ROTATE_MESSAGES[locale];

  return (
    <div
      role="alertdialog"
      aria-label={messages.title}
      className="portrait-lock fixed inset-0 z-[100] flex-col items-center justify-center gap-4 bg-black px-8 text-center"
    >
      <svg
        width="72"
        height="72"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-lime-green"
        role="img"
        aria-label={messages.iconLabel}
      >
        {/* An upright phone, over the arc that turns one back to it. */}
        <rect x="16" y="4" width="16" height="25" rx="3" />
        <path d="M16 9h16" />
        <path d="M8 34a18 18 0 0 0 32 0" />
        <polyline points="34 34 40 34 40 40" />
      </svg>

      <p className="text-h2 font-black uppercase tracking-wide text-white">{messages.title}</p>
      <p className="max-w-xs text-body text-white/70">{messages.body}</p>
    </div>
  );
}
