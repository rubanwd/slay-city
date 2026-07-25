/**
 * Which elements count as "artwork" for the long-press guard.
 *
 * Long-pressing the mascot or the district map used to open the OS
 * "Save Image / Copy" sheet: it interrupts play mid-mission and hands the
 * artwork out for download. Cancelling the `contextmenu` event is the only way
 * to stop that on Android (iOS is handled in CSS with `-webkit-touch-callout`),
 * but cancelling it document-wide would also kill the long-press
 * Select/Copy/Paste menu inside text fields — so the guard has to look at what
 * was actually pressed.
 */
const PROTECTED_MEDIA_TAGS = new Set(["IMG", "PICTURE", "SVG", "VIDEO", "CANVAS"]);

/**
 * The minimum shape {@link isProtectedMedia} needs from an event target — a
 * plain structural subset of `Element`, so the check stays unit-testable
 * without a DOM.
 */
export interface MediaGuardTarget {
  tagName?: string;
  parentElement?: MediaGuardTarget | null;
}

/**
 * True when `target` is artwork, or sits inside artwork a few levels up.
 *
 * The walk upwards exists for inline SVG: a long press lands on whichever
 * `<path>`/`<g>` is under the finger, not on the `<svg>` root. Three levels is
 * plenty for that and keeps the guard from claiming every element on the page
 * just because some ancestor happens to be a `<picture>`.
 */
export function isProtectedMedia(target: MediaGuardTarget | null | undefined, maxDepth = 3): boolean {
  let node = target;
  for (let depth = 0; node && depth <= maxDepth; depth += 1) {
    if (node.tagName && PROTECTED_MEDIA_TAGS.has(node.tagName.toUpperCase())) return true;
    node = node.parentElement;
  }
  return false;
}
