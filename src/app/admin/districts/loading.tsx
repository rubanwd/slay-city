import FullScreenLoader from "@/components/ui/FullScreenLoader";

/**
 * Route transition fallback for this admin segment. Each admin page is an async
 * Server Component that gates on the admin role and runs remote Supabase
 * queries, so it suspends on navigation. A per-segment `loading.tsx` gives an
 * *instant* loader on every hop — including going deeper into an already-mounted
 * parent and back-arrow navigation — instead of only on the first entry into
 * `/admin`, where the shared `/admin/loading.tsx` boundary is already committed
 * and would otherwise leave the tap with no feedback.
 *
 * Uses the quieter mascot-free loader, matching the rest of the admin tooling.
 */
export default function Loading() {
  return <FullScreenLoader mascot={false} label="Loading…" />;
}
