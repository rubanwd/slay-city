import FullScreenLoader from "@/components/ui/FullScreenLoader";

/**
 * App-wide route transition fallback. Next.js shows this instantly when
 * navigating between pages while the destination Server Component fetches its
 * data (auth + remote Supabase queries), so tab switches feel immediate instead
 * of hanging on the previous screen.
 */
export default function Loading() {
  return <FullScreenLoader />;
}
