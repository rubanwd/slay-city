import FullScreenLoader from "@/components/ui/FullScreenLoader";

/** Route transition fallback for this teacher segment (a topic's task list). */
export default function Loading() {
  return <FullScreenLoader mascot={false} label="Loading…" />;
}
