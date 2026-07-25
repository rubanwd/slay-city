import type { NavIconName } from "@/components/layout";

import { getMessages } from "./index";
import type { Locale } from "./locales";

/**
 * The student tab bar's labels in a given language.
 *
 * `BottomNav` keys its label overrides by icon rather than by position, so the
 * same object works whether or not the Homework tab is showing. Every student
 * screen that renders the bar passes this — the tabs are one bar the player
 * sees everywhere, so they must not change language from screen to screen.
 */
export function studentNavLabels(locale: Locale): Partial<Record<NavIconName, string>> {
  const nav = getMessages(locale).student.nav;
  return {
    map: nav.map,
    wardrobe: nav.wardrobe,
    homework: nav.homework,
    profile: nav.profile,
  };
}
