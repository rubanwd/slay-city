"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "./locales";

/**
 * Stores (or clears) a manual language choice — the parent console's and the
 * student's alike, since both read the same preference.
 *
 * `"auto"` deletes the cookie and hands the decision back to the default: the
 * browser's `Accept-Language` for a parent, a fixed language for a student
 * (see {@link file://./locales.ts}). Any unrecognised value is treated the same
 * way rather than trusted into the cookie.
 *
 * The cookie carries no identity, just a display preference. Everything below
 * the root layout is revalidated because the language now reaches both consoles
 * and the game's own tab bar, not just `/parent`.
 */
export async function setLocalePreference(value: string): Promise<void> {
  const store = await cookies();

  if (isLocale(value)) {
    store.set(LOCALE_COOKIE, value, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
    });
  } else {
    store.delete(LOCALE_COOKIE);
  }

  revalidatePath("/", "layout");
}
