"use client";

import { useEffect } from "react";

import { isProtectedMedia } from "@/lib/mediaGuard";

/**
 * Stops the mascot, the city map and every other piece of artwork from being
 * saved out of the app with a long press.
 *
 * Two halves, because the platforms disagree:
 * - iOS/WebKit honors `-webkit-touch-callout: none`, applied to media in
 *   `globals.css` — no JavaScript involved.
 * - Android/Chromium ignores that property and opens its "Download image"
 *   sheet off the `contextmenu` event instead, so the event has to be
 *   cancelled. It is only cancelled for touch input (`pointer: coarse`) and
 *   only over artwork, so the admin console keeps its desktop right-click and
 *   long-pressing a text field still offers Select/Copy/Paste.
 *
 * `dragstart` is the desktop equivalent — dragging an image out of the page is
 * the mouse-driven way to the same file — and is cheap to close off here too.
 */
export function MediaGuard() {
  useEffect(() => {
    const blockOnMedia = (event: Event) => {
      if (isProtectedMedia(event.target as HTMLElement | null)) event.preventDefault();
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (!window.matchMedia("(pointer: coarse)").matches) return;
      blockOnMedia(event);
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", blockOnMedia);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", blockOnMedia);
    };
  }, []);

  return null;
}
