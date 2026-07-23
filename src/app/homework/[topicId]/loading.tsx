import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { readMascotImageCookie } from "@/features/wardrobe/loadMascot";

/**
 * Route transition fallback for this segment. A per-segment `loading.tsx`
 * gives an *instant* loader on every hop into a topic — including
 * back-arrow navigation from here to `/homework` — instead of only on first
 * entry into `/homework`, where the shared `loading.tsx` boundary there is
 * already committed and would otherwise leave the tap with no feedback.
 *
 * Reads the cached mascot cookie (not a DB query) to keep this instant while
 * still matching the child's equipped Wardrobe look.
 */
export default async function Loading() {
  const mascotImageUrl = await readMascotImageCookie();
  return <FullScreenLoader label="Loading topic…" mascotImageUrl={mascotImageUrl} />;
}
