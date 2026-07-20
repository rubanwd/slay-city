import FullScreenLoader from "@/components/ui/FullScreenLoader";

/**
 * Route transition fallback for `/teacher`. The dashboard fetches groups, then
 * every member's progress summary per group — several sequential remote
 * round-trips — so it needs an immediate loading state rather than leaving the
 * previous screen on screen.
 */
export default function Loading() {
  return <FullScreenLoader mascot={false} label="Loading dashboard…" />;
}
