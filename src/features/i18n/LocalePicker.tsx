"use client";

import { useTransition } from "react";

import { setLocalePreference } from "./actions";
import { getMessages } from "./index";
import { LOCALE_LABELS, LOCALES, type Locale } from "./locales";

export interface LocalePickerProps {
  /** The language currently being rendered. */
  locale: Locale;
  /** True when {@link locale} came from a manual choice rather than the browser. */
  manual: boolean;
  /** The language the browser asks for — what "Automatic" resolves to. */
  detected: Locale;
}

/**
 * Language switcher for the parent profile.
 *
 * "Automatic" is the default and the first option: it clears the stored choice
 * so the browser's `Accept-Language` decides again. Picking a language pins it
 * instead. Selecting either writes the preference server-side and revalidates,
 * so the whole console re-renders in the new language without a full reload.
 */
export default function LocalePicker({ locale, manual, detected }: LocalePickerProps) {
  const [pending, startTransition] = useTransition();
  const messages = getMessages(locale);

  function choose(value: Locale | "auto") {
    startTransition(async () => {
      await setLocalePreference(value);
    });
  }

  const options: { value: Locale | "auto"; label: string; selected: boolean }[] = [
    { value: "auto", label: messages.profile.languageAuto, selected: !manual },
    ...LOCALES.map((option) => ({
      value: option,
      label: LOCALE_LABELS[option],
      selected: manual && option === locale,
    })),
  ];

  return (
    <section
      aria-label={messages.profile.languageTitle}
      className={[
        "flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4",
        pending ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-label text-white/50">{messages.profile.languageTitle}</h2>
        <p className="text-small text-white/50">{messages.profile.languageHint}</p>
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

      {!manual && (
        <p className="text-small text-white/40">
          {messages.profile.languageAutoHint(LOCALE_LABELS[detected])}
        </p>
      )}
    </section>
  );
}
