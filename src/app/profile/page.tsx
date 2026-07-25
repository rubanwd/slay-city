import AuthGuard from "@/components/auth/AuthGuard";
import { BottomNav } from "@/components/layout";
import { studentNavLabels } from "@/features/i18n/navLabels";
import { resolveStudentLocale } from "@/features/i18n/server";
import { hasAnyGroup } from "@/features/homework/queries";
import { DEFAULT_KNOWLEDGE_LEVEL, isKnowledgeLevel } from "@/features/levels/levels";
import { getAvailableLevels } from "@/features/levels/queries";
import ProfileScreen from "@/features/profile/ProfileScreen";
import { loadMascotImage } from "@/features/wardrobe/loadMascot";
import { DEFAULT_MASCOT_IMAGE } from "@/features/wardrobe/mascot";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const [supabase, locale] = await Promise.all([createClient(), resolveStudentLocale()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The avatar is always the player's snake wearing whatever they equipped in
  // the wardrobe — never an uploaded picture or a letter placeholder.
  const [mascotImageUrl, profileRes, showHomework, availableLevels] = user
    ? await Promise.all([
        loadMascotImage(supabase, user.id),
        supabase.from("profiles").select("username, level").eq("id", user.id).maybeSingle(),
        hasAnyGroup(supabase),
        getAvailableLevels(supabase),
      ])
    : [DEFAULT_MASCOT_IMAGE, null, false, []];

  const level = isKnowledgeLevel(profileRes?.data?.level)
    ? profileRes.data.level
    : DEFAULT_KNOWLEDGE_LEVEL;

  return (
    <AuthGuard>
      <ProfileScreen
        username={profileRes?.data?.username ?? null}
        email={user?.email ?? null}
        mascotImageUrl={mascotImageUrl}
        level={level}
        availableLevels={availableLevels}
        locale={locale}
        showLanguagePicker
      />
      <BottomNav showHomework={showHomework} labels={studentNavLabels(locale)} />
    </AuthGuard>
  );
}
