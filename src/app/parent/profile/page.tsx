import AuthGuard from "@/components/auth/AuthGuard";
import { BottomNav } from "@/components/layout";
import { DEFAULT_KNOWLEDGE_LEVEL, isKnowledgeLevel } from "@/features/levels/levels";
import { getAvailableLevels } from "@/features/levels/queries";
import { requireParentPage } from "@/features/parent/guard";
import ProfileScreen from "@/features/profile/ProfileScreen";
import { DEFAULT_MASCOT_IMAGE } from "@/features/wardrobe/mascot";

/**
 * Parent's own account screen at `/parent/profile`. The same screen the child
 * gets, minus what only a player has: no equipped wardrobe look (the plain
 * snake stands in as the avatar) and no progress to reset.
 *
 * The level picker here is the one place a parent chooses which level their
 * map preview shows; it only offers levels that already have content, so today
 * it stays on Elementary.
 */
export default async function ParentProfilePage() {
  const { supabase, profileId, email } = await requireParentPage();

  const [profileRes, availableLevels] = await Promise.all([
    supabase.from("profiles").select("username, level").eq("id", profileId).maybeSingle(),
    getAvailableLevels(supabase),
  ]);

  const level = isKnowledgeLevel(profileRes.data?.level)
    ? profileRes.data.level
    : DEFAULT_KNOWLEDGE_LEVEL;

  return (
    <AuthGuard>
      <ProfileScreen
        username={profileRes.data?.username ?? null}
        email={email}
        mascotImageUrl={DEFAULT_MASCOT_IMAGE}
        level={level}
        availableLevels={availableLevels}
        roleLabel="Parent"
        levelHint="Sets which level your city map shows."
        showProgressReset={false}
      />
      <BottomNav role="parent" />
    </AuthGuard>
  );
}
