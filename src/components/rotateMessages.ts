import type { Locale } from "@/features/i18n/locales";

/**
 * Copy for the "turn your phone back upright" screen.
 *
 * Like the install nudge in `installMessages.ts`, and unlike the parent-console
 * dictionary in `@/features/i18n`, this isn't English-learning content — it is
 * an instruction about the device itself, and a student stuck behind it can't
 * reach the game to read anything. So it follows whatever language the browser
 * (or a saved preference) resolves to for anyone holding the phone.
 */
export interface RotateMessages {
  title: string;
  body: string;
  /** Accessible label for the rotate illustration. */
  iconLabel: string;
}

export const ROTATE_MESSAGES: Record<Locale, RotateMessages> = {
  en: {
    title: "Turn your phone upright",
    body: "SLAY CITY is played in portrait. Rotate your phone to keep going.",
    iconLabel: "Rotate your phone to portrait",
  },
  uk: {
    title: "Поверни телефон вертикально",
    body: "SLAY CITY працює лише вертикально. Поверни телефон, щоб продовжити.",
    iconLabel: "Поверни телефон вертикально",
  },
  ru: {
    title: "Поверни телефон вертикально",
    body: "SLAY CITY работает только вертикально. Поверни телефон, чтобы продолжить.",
    iconLabel: "Поверни телефон вертикально",
  },
};
