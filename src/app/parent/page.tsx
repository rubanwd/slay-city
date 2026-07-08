import { redirect } from "next/navigation";

import AuthGuard from "@/components/auth/AuthGuard";
import ParentDashboard from "@/features/parent/ParentDashboard";
import { getParentProgressSummary } from "@/features/parent/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Read-only parent dashboard at `/parent`.
 *
 * Auth is enforced by middleware; here we additionally gate on role — only
 * `parent` and `admin` may view it. `child` users are redirected to the map.
 *
 * MVP scope: a parent views their own linked profile's stats. Parent↔child
 * linking is a future milestone; until then `profile.id` is the child profile.
 */
export default async function ParentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Middleware already redirects unauthenticated requests; this keeps the
    // page well-typed without a non-null assertion.
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, role")
    .eq("id", user.id)
    .maybeSingle();

  // Child role (or a missing profile) cannot access the dashboard.
  if (!profile || profile.role === "child") {
    redirect("/map");
  }

  const summary = await getParentProgressSummary(supabase, profile.id);

  return (
    <AuthGuard>
      <ParentDashboard childName={profile.username} summary={summary} />
    </AuthGuard>
  );
}
