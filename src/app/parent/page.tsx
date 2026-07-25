import AuthGuard from "@/components/auth/AuthGuard";
import { resolveLocale } from "@/features/i18n/server";
import ParentDashboard from "@/features/parent/ParentDashboard";
import { requireParentPage } from "@/features/parent/guard";
import { getParentDashboardData } from "@/features/parent/queries";

/**
 * Read-only parent dashboard at `/parent`.
 *
 * Auth is enforced by middleware; `requireParentPage` additionally gates on
 * role — only `parent` and `admin` may view it. The dashboard shows the progress of the
 * *student* account whose email the parent supplied at registration (stored in
 * the parent's auth metadata as `student_email`).
 *
 * The student may register before or after the parent, so we (re)establish the
 * link on each visit via the `link_student_by_email` function, which resolves the
 * email to a student profile and records the link. RLS then lets the parent read
 * that student's stats and progress. Until a matching student account exists, the
 * dashboard shows a "not linked yet" state instead of misleading zeros.
 *
 * The page speaks the parent's language: their manual choice if they made one,
 * otherwise whatever their browser asks for (see `resolveLocale`).
 */
export default async function ParentPage() {
  const [{ supabase, profileId, studentEmail }, { locale }] = await Promise.all([
    requireParentPage(),
    resolveLocale(),
  ]);

  // Already linked from a previous visit?
  const { data: existingLink } = await supabase
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_id", profileId)
    .order("created_at")
    .limit(1);

  let studentId = existingLink?.[0]?.student_id ?? null;
  let reason = studentId ? "ok" : studentEmail ? "student_not_registered" : "no_email";

  // Not linked yet — try to establish the link by the registered student email.
  if (!studentId && studentEmail) {
    const { data: linkResult } = await supabase.rpc("link_student_by_email", {
      p_student_email: studentEmail,
    });
    const row = linkResult?.[0];
    if (row?.linked && row.student_id) {
      studentId = row.student_id;
      reason = "ok";
    } else {
      reason = row?.reason ?? "student_not_registered";
    }
  }

  // No linked student yet: show the pending state rather than fake stats.
  if (!studentId) {
    return (
      <AuthGuard>
        <ParentDashboard locale={locale} pending={{ studentEmail, reason }} />
      </AuthGuard>
    );
  }

  const data = await getParentDashboardData(supabase, studentId);

  return (
    <AuthGuard>
      <ParentDashboard
        locale={locale}
        studentName={studentEmail ?? undefined}
        data={data}
      />
    </AuthGuard>
  );
}
