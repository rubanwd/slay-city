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
 * screen is pinned to the viewport (`h-dvh`, like the game screens) and the
 * content gets a real scrollable element of its own, which behaves the same
 * everywhere.
 *
 * Content still needs `BOTTOM_NAV_CLEARANCE` worth of bottom padding: the nav
 * is fixed on top of this area, not below it.
 *
 * Anything a layout stacks above the screen — the teacher console's "viewing
 * as" banner — has to come off that height, or the bottom of the scroll area
 * ends up below the fold and the last rows of content can never clear the nav.
 * Such a layout sets `--screen-top-offset` to its own height (see
 * `VIEW_AS_BANNER_OFFSET`); with nothing stacked above, the screen is the full
 * viewport as before.
 */
export default function ScrollScreen({ children, footer, className = "" }: ScrollScreenProps) {
  return (
    <main
      className={`h-[calc(100dvh-var(--screen-top-offset,0px))] overflow-hidden bg-black text-white ${className}`.trim()}
    >
      <div className="h-full overflow-y-auto overscroll-contain">{children}</div>
      {footer}
    </main>
  );
}
