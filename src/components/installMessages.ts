import type { Locale } from "@/features/i18n/locales";

/**
 * Copy for the "Add to Home Screen" nudge, in the languages the app speaks.
 *
 * Unlike the parent-console dictionary in `@/features/i18n`, this isn't
 * gated to the parent console — the prompt is a generic OS-level nudge, not
 * English-learning content, so it follows whatever language the browser (or
 * a saved preference) resolves to for anyone using the device.
 *
 * `{{icon}}` marks where the Share glyph is inserted; `**text**` marks the
 * words that name an on-screen button, rendered bold so they're easy to
 * match against what's actually on screen.
 */
export interface InstallMessages {
  title: string;
  androidBody: string;
  notNow: string;
  installButton: string;
  /** Icon's accessible label — the word iOS itself uses for the Share button. */
  shareLabel: string;
  /** Safari on iOS: Share sits in the toolbar (bottom on iPhone, top on iPad). */
  iosSafariBody: string;
  /** Chrome on iOS: Share sits next to the address bar, not the toolbar. */
  iosChromeBody: string;
  /** Any other iOS browser (Firefox, Edge, in-app browsers…) — safe fallback wording. */
  iosGenericBody: string;
}

export const INSTALL_MESSAGES: Record<Locale, InstallMessages> = {
  en: {
    title: "Install SLAY CITY",
    androidBody: "Add it to your home screen for instant, full-screen access — no browser tabs.",
    notNow: "Not now",
    installButton: "Install",
    shareLabel: "Share",
    iosSafariBody: "Tap {{icon}} **Share** in the toolbar, then **Add to Home Screen**.",
    iosChromeBody: "Tap {{icon}} **Share** next to the address bar, then **Add to Home Screen**.",
    iosGenericBody: "Open your browser's **Share** or menu button, then choose **Add to Home Screen**.",
  },
  uk: {
    title: "Встановити SLAY CITY",
    androidBody:
      "Додайте на головний екран для миттєвого доступу на весь екран — без вкладок браузера.",
    notNow: "Не зараз",
    installButton: "Встановити",
    shareLabel: "Поділитися",
    iosSafariBody: "Натисніть {{icon}} **Поділитися** на панелі інструментів, потім **На екран «Додому»**.",
    iosChromeBody: "Натисніть {{icon}} **Поділитися** біля адресного рядка, потім **На екран «Додому»**.",
    iosGenericBody:
      "Відкрийте кнопку **Поділитися** або меню браузера, потім оберіть **На екран «Додому»**.",
  },
  ru: {
    title: "Установить SLAY CITY",
    androidBody:
      "Добавьте на главный экран для мгновенного полноэкранного доступа — без вкладок браузера.",
    notNow: "Не сейчас",
    installButton: "Установить",
    shareLabel: "Поделиться",
    iosSafariBody: "Нажмите {{icon}} **Поделиться** на панели инструментов, затем **На экран «Домой»**.",
    iosChromeBody: "Нажмите {{icon}} **Поделиться** рядом с адресной строкой, затем **На экран «Домой»**.",
    iosGenericBody:
      "Откройте кнопку **Поделиться** или меню браузера, затем выберите **На экран «Домой»**.",
  },
};
