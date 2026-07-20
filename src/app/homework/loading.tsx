import FullScreenLoader from "@/components/ui/FullScreenLoader";

/**
 * Route transition fallback for `/homework`. The list page fetches the
 * child's groups, then every group's topics, tasks, and completions —
 * several sequential remote round-trips — so it needs an immediate loading
 * state rather than leaving the previous screen frozen with no feedback.
 */
export default function Loading() {
  return <FullScreenLoader label="Loading homework…" />;
}
