"use client";

import { useSyncExternalStore } from "react";

import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { DEFAULT_LOCALE, getMessages } from "@/features/i18n";
import { readClientLocale } from "@/features/i18n/clientLocale";

/** The language never changes while a fallback is on screen, so nothing to subscribe to. */
const noSubscribe = () => () => {};

/**
 * Route transition fallback for the parent console. The dashboard resolves the
 * parent's role, (re)links the student account by email and then aggregates that
 * student's progress — several sequential remote round-trips — so it needs an
 * immediate loading state rather than leaving the previous screen on screen.
 *
 * A Suspense fallback renders before any server data is available, so the
 * language is read in the browser instead: English on the first paint, switching
 * as soon as the effect runs. The label is one word; a flash of it in English is
 * a better trade than blocking the fallback on a server round-trip.
 */
export default function Loading() {
  const locale = useSyncExternalStore(noSubscribe, readClientLocale, () => DEFAULT_LOCALE);

  return <FullScreenLoader mascot={false} label={getMessages(locale).common.loading} />;
}
