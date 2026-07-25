"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ShareIcon from "@/components/ui/ShareIcon";
import { INSTALL_MESSAGES } from "@/components/installMessages";
import { renderInstallTemplate } from "@/components/renderInstallTemplate";
import { readClientLocale } from "@/features/i18n/clientLocale";
import type { Locale } from "@/features/i18n/locales";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

type Variant = "android" | "ios" | null;

/** Which iOS browser is showing the prompt — the Share button lives in a different place in each. */
type IOSBrowser = "safari" | "chrome" | "other";

const DISMISS_KEY = "slaycity-install-dismissed-at";
const INSTALLED_KEY = "slaycity-install-installed";
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // don't nag again for 2 weeks
const ENGAGEMENT_DELAY_MS = 10_000; // let them play first, don't greet with a popup

function isStandaloneDisplay() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIOSDevice() {
  const ua = window.navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ identifies as "Macintosh" in the UA string; touch support is the tell.
  const isIPadOS = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return isIOS || isIPadOS;
}

/**
 * Third-party iOS browsers are still WebKit under Apple's rules, but their
 * chrome differs from Safari's: Chrome tucks Share next to the address bar
 * instead of Safari's toolbar, and other browsers (Firefox, Edge, in-app
 * webviews…) vary enough that a generic "find Share or the menu" is safest.
 * Each browser tags its own UA token, so these checks must run before the
 * plain "Safari" fallback, since every WebKit browser's UA contains that word.
 */
function detectIOSBrowser(): IOSBrowser {
  if (typeof navigator === "undefined") return "safari";
  const ua = navigator.userAgent;
  if (/CriOS/i.test(ua)) return "chrome";
  if (/FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua)) return "other";
  return "safari";
}

function wasRecentlyDismissed() {
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

/**
 * Custom "Add to Home Screen" nudge, since neither platform lets a web app
 * install itself with zero user action:
 * - Android/Chromium: capture `beforeinstallprompt` and replace the default
 *   mini-infobar with our own banner so the one native tap happens on our
 *   terms (timing, copy) instead of whenever Chrome feels like it.
 * - iOS: there is no installable-PWA API at all (Apple doesn't ship one), so
 *   the best available UX is a clear, well-timed pointer at the manual
 *   Share → Add to Home Screen steps. Where that Share button lives differs
 *   by browser (Safari's toolbar vs. Chrome's address bar), so the copy is
 *   picked per browser via {@link detectIOSBrowser}.
 *
 * Copy is localized to whatever language the browser (or a saved
 * preference) resolves to — see {@link readClientLocale} — since this is a
 * generic OS-level nudge, not English-learning content.
 */
export function InstallPrompt() {
  const [variant, setVariant] = useState<Variant>(null);
  const [iosBrowser] = useState<IOSBrowser>(() => detectIOSBrowser());
  const [locale] = useState<Locale>(() => readClientLocale());
  const [open, setOpen] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandaloneDisplay() || window.localStorage.getItem(INSTALLED_KEY) === "1") {
      return;
    }

    let engagementTimer: ReturnType<typeof setTimeout> | undefined;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      if (wasRecentlyDismissed()) return;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      engagementTimer = setTimeout(() => {
        setVariant("android");
        requestAnimationFrame(() => setOpen(true));
      }, ENGAGEMENT_DELAY_MS);
    };

    const handleAppInstalled = () => {
      window.localStorage.setItem(INSTALLED_KEY, "1");
      setOpen(false);
      setVariant(null);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (isIOSDevice() && !wasRecentlyDismissed()) {
      engagementTimer = setTimeout(() => {
        setVariant("ios");
        requestAnimationFrame(() => setOpen(true));
      }, ENGAGEMENT_DELAY_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (engagementTimer) clearTimeout(engagementTimer);
    };
  }, []);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
    setTimeout(() => setVariant(null), 300);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    setOpen(false);
    const prompt = deferredPrompt;
    setDeferredPrompt(null);
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    window.localStorage.setItem(
      outcome === "accepted" ? INSTALLED_KEY : DISMISS_KEY,
      outcome === "accepted" ? "1" : String(Date.now())
    );
    setTimeout(() => setVariant(null), 300);
  }, [deferredPrompt]);

  if (!variant) return null;

  const messages = INSTALL_MESSAGES[locale];
  const iosBody =
    iosBrowser === "safari"
      ? messages.iosSafariBody
      : iosBrowser === "chrome"
        ? messages.iosChromeBody
        : messages.iosGenericBody;

  return createPortal(
    <div
      role="dialog"
      aria-live="polite"
      aria-label={messages.title}
      className="fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-4"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div
        className={[
          "relative w-full max-w-md rounded-2xl border border-neon-pink/50 bg-[#1a1a1a] p-4 pr-10",
          "shadow-[0_0_40px_8px_rgba(255,45,142,0.3)]",
          "transition-all duration-300",
          open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className={[
            "absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full",
            "text-white/40 hover:text-white hover:bg-white/10",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink",
          ].join(" ")}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192x192.png" alt="" className="h-12 w-12 rounded-xl flex-none" />

          {variant === "android" ? (
            <div className="flex-1 min-w-0">
              <p className="text-body font-bold text-white">{messages.title}</p>
              <p className="text-small text-white/70">{messages.androidBody}</p>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <p className="text-body font-bold text-white">{messages.title}</p>
              <p className="mt-1 text-small text-white/70">
                {renderInstallTemplate(
                  iosBody,
                  <ShareIcon
                    className="inline h-4 w-4 -translate-y-0.5 text-neon-pink"
                    title={messages.shareLabel}
                  />
                )}
              </p>
            </div>
          )}
        </div>

        {variant === "android" && (
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-xl px-3 py-2 text-small font-semibold text-white/70 transition-colors hover:text-white"
            >
              {messages.notNow}
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className={[
                "rounded-xl bg-neon-pink px-4 py-2 text-small font-extrabold text-white",
                "hover:brightness-110 active:brightness-90 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              ].join(" ")}
            >
              {messages.installButton}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default InstallPrompt;
