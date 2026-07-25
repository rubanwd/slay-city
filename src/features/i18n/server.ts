import { cookies, headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  matchLocale,
  type Locale,
} from "./locales";

export interface ResolvedLocale {
  /** The language to render in. */
  locale: Locale;
  /** What the browser asked for, whether or not it is being used. */
  detected: Locale;
  /** True when the parent picked the language by hand on their profile. */
  manual: boolean;
}

/**
 * Which language to render the parent console in.
 *
 * The browser decides by default — `Accept-Language` is what the parent already
 * told every site they visit, so nothing has to be configured. A manual choice
 * on the profile screen writes a cookie, and from then on that cookie wins
 * until it is cleared back to "Automatic".
 *
 * `detected` is returned alongside so the profile screen can name the language
 * automatic mode would land on ("Following your browser — currently Ukrainian").
 */
export async function resolveLocale(): Promise<ResolvedLocale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  const detected = matchLocale(headerList.get("accept-language")) ?? DEFAULT_LOCALE;
  const chosen = cookieStore.get(LOCALE_COOKIE)?.value;

  if (isLocale(chosen)) {
    return { locale: chosen, detected, manual: true };
  }
  return { locale: detected, detected, manual: false };
}
