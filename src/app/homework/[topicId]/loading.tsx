import FullScreenLoader from "@/components/ui/FullScreenLoader";

/**
 * Route transition fallback for this segment. A per-segment `loading.tsx`
 * gives an *instant* loader on every hop into a topic — including
 * back-arrow navigation from here to `/homework` — instead of only on first
 * entry into `/homework`, where the shared `loading.tsx` boundary there is
 * already committed and would otherwise leave the tap with no feedback.
 */
export default function Loading() {
  return <FullScreenLoader label="Loading topic…" />;
}
