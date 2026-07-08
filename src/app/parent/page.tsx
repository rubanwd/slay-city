import { redirect } from "next/navigation";

import AuthGuard from "@/components/auth/AuthGuard";
import ParentDashboard from "@/features/parent/ParentDashboard";
import { getParentProgressSummary } from "@/features/parent/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * Read-only parent dashboard at `/parent`.
 *
 * Auth is enforced by middleware; here we additionally gate on role — only
 * `parent` and `admin` may view it. The dashboard shows the progress of the
 * *child* account whose email the parent supplied at registration (stored in
 * the parent's auth metadata as `child_email`).
 *
 * The child may register before or after the parent, so we (re)establish the
 * link on each visit via the `link_child_by_email` function, which resolves the
 * email to a child profile and records the link. RLS then lets the parent read
 * that child's stats and progress. Until a matching child account exists, the
 * dashboard shows a "not linked yet" state instead of misleading zeros.
 */
export default async function ParentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  // Child role (or a missing profile) cannot access the dashboard.
  if (!profile || profile.role === "child") {
    redirect("/map");
  }

  const childEmail =
    typeof user.user_metadata?.child_email === "string" ? user.user_metadata.child_email : null;

  // Already linked from a previous visit?
  const { data: existingLink } = await supabase
    .from("parent_child_links")
    .select("child_id")
    .eq("parent_id", profile.id)
    .order("created_at")
    .limit(1);

  let childId = existingLink?.[0]?.child_id ?? null;
  let reason = childId ? "ok" : childEmail ? "child_not_registered" : "no_email";

  // Not linked yet — try to establish the link by the registered child email.
  if (!childId && childEmail) {
    const { data: linkResult } = await supabase.rpc("link_child_by_email", {
      p_child_email: childEmail,
    });
    const row = linkResult?.[0];
    if (row?.linked && row.child_id) {
      childId = row.child_id;
      reason = "ok";
    } else {
      reason = row?.reason ?? "child_not_registered";
    }
  }

  // No linked child yet: show the pending state rather than fake stats.
  if (!childId) {
    return (
      <AuthGuard>
        <ParentDashboard pending={{ childEmail, reason }} />
      </AuthGuard>
    );
  }

  const { data: childProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", childId)
    .maybeSingle();

  const summary = await getParentProgressSummary(supabase, childId);

  return (
    <AuthGuard>
      <ParentDashboard
        childName={childProfile?.username ?? childEmail ?? "Your child"}
        summary={summary}
      />
    </AuthGuard>
  );
}
