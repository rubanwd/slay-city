"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "./locales";

/**
 * Stores (or clears) the parent's manual language choice.
 *
 * `"auto"` deletes the cookie and hands the decision back to the browser's
 * `Accept-Language` — the default every parent starts on. Any unrecognised
 * value is treated the same way rather than trusted into the cookie.
 *
 * The cookie is deliberately readable by JavaScript-free navigation only — it
 * carries no identity, just a display preference — and the whole `/parent`
 * subtree is revalidated so the next render speaks the new language.
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

  revalidatePath("/parent", "layout");
}
