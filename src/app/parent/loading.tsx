import FullScreenLoader from "@/components/ui/FullScreenLoader";

/**
 * Route transition fallback for `/parent`. The dashboard resolves the parent's
 * role, (re)links the student account by email and then aggregates that student's
 * progress — several sequential remote round-trips — so it needs an immediate
 * loading state rather than leaving the previous screen on screen.
 */
export default function Loading() {
  return <FullScreenLoader mascot={false} label="Loading dashboard…" />;
}
