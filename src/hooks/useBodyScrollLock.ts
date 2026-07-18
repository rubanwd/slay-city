"use client";

import { useEffect } from "react";

// Module-level lock shared by every caller so overlapping locks (two modals
// open at once, or opened/closed in different orders) can't corrupt each other.
let lockCount = 0;
let savedOverflow = "";

/**
 * Prevents the page behind a modal from scrolling by setting `body` overflow to
 * `hidden` while `active` is true.
 *
 * Reference-counted on purpose: the naive "capture the current overflow on open,
 * restore it on close" pattern breaks the moment two locks overlap — the second
 * one captures the already-hidden value as its "original" and, when it releases,
 * pins `body` to `hidden` forever, leaving the whole page unscrollable. Here the
 * real page value is captured only on the first lock (0 → 1) and restored only
 * when the last lock releases (1 → 0), so any open/close order is safe.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    if (lockCount === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = savedOverflow;
      }
    };
  }, [active]);
}
