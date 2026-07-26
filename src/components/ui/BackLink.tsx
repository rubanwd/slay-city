"use client";

import { useRouter } from "next/navigation";

export interface BackLinkProps {
  /** Text shown; the arrow is part of it so callers can translate the whole label. */
  label?: string;
  /**
   * Where to go when there is nothing to go back to — someone who opened this
   * page directly (a bookmark, a shared link, a fresh tab) has no previous page
   * in this tab's history. Defaults to the welcome screen.
   */
  fallbackHref?: string;
  className?: string;
}

/**
 * "Back to where you came from" — a plain, quiet way off a screen the visitor
 * may have opened by accident.
 *
 * Deliberately the browser's own back rather than a fixed destination: this is
 * used on screens (the login form) reachable from several places, and sending
 * everyone to the same one would strand whoever came from somewhere else.
 */
export default function BackLink({
  label = "← Back",
  fallbackHref = "/",
  className = "",
}: BackLinkProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        // A length of 1 means this page is the whole history of the tab.
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className={[
        "rounded-xl px-3 py-2 text-sm font-semibold text-white/50",
        "transition-colors hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-green focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </button>
  );
}
