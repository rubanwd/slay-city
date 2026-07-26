import { getMessages } from "@/features/i18n";
import type { Locale } from "@/features/i18n/locales";

import { restartDemo } from "./actions";

export interface DemoGateNoticeProps {
  /** The visitor's browser language — the demo has no stored preference. */
  locale: Locale;
}

/**
 * Why a visitor who was just playing is suddenly looking at the login screen:
 * the demo gave them one location and it is finished.
 *
 * The way on is the login form below it (which links to registration); the way
 * back is the button here, which clears the demo run so the map is playable
 * again — another location, or the same one from the start.
 */
export default function DemoGateNotice({ locale }: DemoGateNoticeProps) {
  const messages = getMessages(locale).demo;

  return (
    <div className="mb-6 w-full rounded-2xl border-2 border-lime-green bg-lime-green/10 px-4 py-4">
      <p className="text-base font-black uppercase tracking-wide text-lime-green">
        {messages.gateTitle}
      </p>
      <p className="mt-1 text-sm text-white/80">{messages.gateBody}</p>

      <form action={restartDemo}>
        <button
          type="submit"
          className={[
            "mt-3 flex h-12 w-full items-center justify-center rounded-2xl border-2 border-white/25 px-4",
            "text-sm font-extrabold uppercase tracking-wide text-white",
            "transition-colors hover:bg-white/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-green focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          ].join(" ")}
        >
          {messages.gateBack}
        </button>
      </form>
    </div>
  );
}
