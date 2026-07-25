"use client";

import { useTransition } from "react";

import { setLocalePreference } from "./actions";
import { LOCALE_LABELS, LOCALES, type Locale } from "./locales";

export interface LocalePickerProps {
  /** The language currently being rendered. */
  locale: Locale;
  /** Section heading — "Language" in the reader's own language. */
  title: string;
  /** One line under the heading saying what changes. */
  hint: string;
  /**
   * The parent console's "Automatic" option, which clears the stored choice so
   * the browser's `Accept-Language` decides again.
   *
   * Students have no such option: their default is one fixed language, not
   * whatever the phone happens to be set to (see {@link file://./locales.ts}),
   * so for them the three languages are the whole choice.
   */
  auto?: {
    label: string;
    /** True when no manual choice is stored, i.e. Automatic is in effect. */
    selected: boolean;
    /** Names the language Automatic currently resolves to. */
    hint: string;
  };
}

/**
 * Language switcher, shared by the parent console and the student profile.
 *
 * Selecting an option writes the preference server-side and revalidates, so the
 * screen re-renders in the new language without a full reload.
 */
export default function LocalePicker({ locale, title, hint, auto }: LocalePickerProps) {
  const [pending, startTransition] = useTransition();

  function choose(value: Locale | "auto") {
    startTransition(async () => {
      await setLocalePreference(value);
    });
  }

  const options: { value: Locale | "auto"; label: string; selected: boolean }[] = [
    ...(auto ? [{ value: "auto" as const, label: auto.label, selected: auto.selected }] : []),
    ...LOCALES.map((option) => ({
      value: option,
      label: LOCALE_LABELS[option],
      // With Automatic in effect no specific language is the choice, even
      // though one of them is what ends up on screen.
      selected: option === locale && !auto?.selected,
    })),
  ];

  return (
    <section
      aria-label={title}
      className={[
        "flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4",
        pending ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-label text-white/50">{title}</h2>
        <p className="text-small text-white/50">{hint}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={pending}
            aria-pressed={option.selected}
            onClick={() => choose(option.value)}
            className={[
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              "disabled:pointer-events-none",
              option.selected
                ? "border-lime-green bg-lime-green/15 text-lime-green"
                : "border-white/15 text-white/70 hover:bg-white/5",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>

      {auto?.selected && <p className="text-small text-white/40">{auto.hint}</p>}
    </section>
  );
}
