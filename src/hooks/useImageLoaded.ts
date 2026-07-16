"use client";

import { useEffect, useState } from "react";

/**
 * Reports whether `url` has finished decoding, so callers can hold a loader
 * over the frame until a heavy remote image (district backgrounds, served from
 * Supabase Storage) is actually paintable instead of flashing a blank area.
 *
 * Preloads via an `Image()` rather than a JSX `onLoad` because a cached image
 * can complete before React attaches the handler, and that load event is then
 * missed. A null/empty `url` counts as loaded — there is nothing to wait for.
 *
 * Errors resolve as loaded too: the caller should reveal its own fallback
 * rather than sit under a loader forever.
 */
export function useImageLoaded(url: string | null | undefined): boolean {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    const img = new Image();
    let cancelled = false;
    const done = () => {
      if (!cancelled) setLoadedUrl(url);
    };
    img.onload = done;
    img.onerror = done;
    img.src = url;
    if (img.complete) queueMicrotask(done);
    return () => {
      cancelled = true;
    };
  }, [url]);

  return !url || loadedUrl === url;
}
