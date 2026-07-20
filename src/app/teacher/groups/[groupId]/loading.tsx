import FullScreenLoader from "@/components/ui/FullScreenLoader";

/**
 * Route transition fallback for this teacher segment. Gives an instant
 * loader on every hop into a group's homework page — including back-arrow
 * navigation from a topic's tasks page — instead of leaving the previous
 * screen frozen with no feedback.
 */
export default function Loading() {
  return <FullScreenLoader mascot={false} label="Loading…" />;
}
