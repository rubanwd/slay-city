import AuthGuard from "@/components/auth/AuthGuard";
import { BottomNav } from "@/components/layout";
import ProfileScreen from "@/features/profile/ProfileScreen";
import { loadMascotImage } from "@/features/wardrobe/loadMascot";
import { DEFAULT_MASCOT_IMAGE } from "@/features/wardrobe/mascot";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The avatar is always the player's snake wearing whatever they equipped in
  // the wardrobe — never an uploaded picture or a letter placeholder.
  const [mascotImageUrl, profileRes] = user
    ? await Promise.all([
        loadMascotImage(supabase, user.id),
        supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
      ])
    : [DEFAULT_MASCOT_IMAGE, null];

  return (
    <AuthGuard>
      <ProfileScreen
        username={profileRes?.data?.username ?? null}
        email={user?.email ?? null}
        mascotImageUrl={mascotImageUrl}
      />
      <BottomNav />
    </AuthGuard>
  );
}
