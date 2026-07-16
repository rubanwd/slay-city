import FullScreenLoader from "@/components/ui/FullScreenLoader";

/**
 * Route transition fallback for the whole `/admin` tree. Admin pages are async
 * Server Components that gate on the admin role and then run several remote
 * Supabase queries, so without this the previous screen hangs on every hop
 * between the content tools.
 *
 * Sits here rather than relying on the root `app/loading.tsx` so navigating
 * *within* admin only suspends the admin subtree, and so admin tooling gets the
 * quieter mascot-free loader.
 */
export default function Loading() {
  return <FullScreenLoader mascot={false} label="Loading…" />;
}
