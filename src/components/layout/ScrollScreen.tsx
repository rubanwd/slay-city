import { type ReactNode } from "react";

interface ScrollScreenProps {
  children: ReactNode;
  /** Pinned below the scrolling area — the bottom nav on the console screens. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Full-height screen whose content scrolls in its own container instead of
 * scrolling the document.
 *
 * The parent and teacher consoles are long pages sitting under the fixed
 * `BottomNav`. Left to the document scroll they proved unreliable on iOS —
 * added to the home screen, the dashboard would not scroll at all — so the
 * screen owns a real scrollable element of its own, which behaves the same
 * everywhere.
 *
 * The shell is `fixed inset-0` rather than `h-dvh` on purpose. On iOS the two
 * are not interchangeable: an installed PWA lays the page out inside a viewport
 * that is inset from the screen (below the status bar), while `100dvh` can
 * still measure the full screen — so a `h-dvh` screen hangs past the bottom of
 * what you can see, and the last stretch of the list can't be brought into
 * view. `inset-0` is resolved against the very same box the fixed `BottomNav`
 * is positioned in, so the scroll area and the nav can't disagree about where
 * the bottom of the screen is.
 *
 * Taking the screen out of flow also leaves the document itself unscrollable,
 * so a swipe has nowhere to go but this container — no scroll chaining, hence
 * no `overscroll-behavior` needed.
 *
 * Content still needs `BOTTOM_NAV_CLEARANCE` worth of bottom padding: the nav
 * sits on top of this area, not below it.
 */
export default function ScrollScreen({ children, footer, className = "" }: ScrollScreenProps) {
  return (
    <main className={`fixed inset-0 flex flex-col bg-black text-white ${className}`.trim()}>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer}
    </main>
  );
}
