import AuthGuard from "@/components/auth/AuthGuard";
import { resolveLocale } from "@/features/i18n/server";
import ParentProfileScreen from "@/features/parent/ParentProfileScreen";
import { requireParentPage } from "@/features/parent/guard";
import { getLinkedStudent } from "@/features/parent/queries";

/**
 * Parent's own account screen at `/parent/profile`.
 *
 * Two things the student's screen has are deliberately absent: the wardrobe
 * look (a parent never plays, so there is nothing to wear) and the level picker
 * (the level is the student's own choice — it is shown here read-only, next to
 * their name). What remains is the account, the language of this console, and
 * the way out.
 */
export default async function ParentProfilePage() {
  const [{ supabase, profileId, email }, { locale, detected, manual }] = await Promise.all([
    requireParentPage(),
    resolveLocale(),
  ]);

  const [profileRes, student] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", profileId).maybeSingle(),
    getLinkedStudent(supabase, profileId),
  ]);

  return (
    <AuthGuard>
      <ParentProfileScreen
        username={profileRes.data?.username ?? null}
        email={email}
        locale={locale}
        manualLocale={manual}
        detectedLocale={detected}
        student={student ? { username: student.username, level: student.level } : null}
      />
    </AuthGuard>
  );
}
