import FullScreenLoader from "@/components/ui/FullScreenLoader";

/**
 * Route transition fallback for `/admin/users`. The page is an async Server
 * Component that gates on the admin role and lists every account through an
 * RPC, so it suspends on navigation — this keeps the tap feeling instant.
 */
export default function Loading() {
  return <FullScreenLoader mascot={false} label="Loading…" />;
}
