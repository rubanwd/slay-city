"use client";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, matchLocale, type Locale } from "./locales";

/**
 * The parent's language, worked out in the browser.
 *
 * Server components resolve this properly (see {@link file://./server.ts}); this
 * is for the handful of places that render before any server data exists — a
 * route-transition fallback, for instance. It follows the same order: a manual
 * choice in the cookie first, then what the browser asks for, then English.
 *
 * `navigator.languages` is already in preference order and carries no q-values,
 * so joining it produces a header `matchLocale` reads the same way.
 */
export function readClientLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    ?.slice(LOCALE_COOKIE.length + 1);
  if (isLocale(cookie)) return cookie;

  const languages = navigator.languages?.join(",") || navigator.language;
  return matchLocale(languages) ?? DEFAULT_LOCALE;
}
