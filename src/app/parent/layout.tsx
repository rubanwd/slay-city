import type { ReactNode } from "react";

import { resolveLocale } from "@/features/i18n/server";

/**
 * Wraps the whole parent console in the language it is being rendered in.
 *
 * The `lang` attribute matters beyond tidiness: it is what tells a screen
 * reader to switch voices and a browser which hyphenation and quotation rules
 * to apply. It sits on a `display: contents` wrapper rather than on `<html>`,
 * because the student game inside the same app stays in English.
 */
export default async function ParentLayout({ children }: { children: ReactNode }) {
  const { locale } = await resolveLocale();

  return (
    <div lang={locale} className="contents">
      {children}
    </div>
  );
}
