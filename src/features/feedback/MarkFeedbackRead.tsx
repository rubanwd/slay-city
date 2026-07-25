"use client";

import { useEffect, useRef } from "react";

import { markAllFeedbackRead } from "./actions";

/**
 * Clears the unread marker on the admin console's Feedback & Bugs section once
 * the inbox is on screen. Renders nothing.
 *
 * Deliberately does not refresh the page afterwards: the "New" chips stay
 * visible while the admin reads this visit's reports, and the menu badge is
 * recomputed on the next navigation — which is the only place it's visible.
 * The ref guard keeps a re-render from firing a second write.
 */
export default function MarkFeedbackRead() {
  const marked = useRef(false);

  useEffect(() => {
    if (marked.current) return;
    marked.current = true;
    void markAllFeedbackRead();
  }, []);

  return null;
}
