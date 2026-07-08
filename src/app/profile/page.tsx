import AuthGuard from "@/components/auth/AuthGuard";
import { BottomNav } from "@/components/layout";
import ProfileScreen from "@/features/profile/ProfileScreen";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <AuthGuard>
      <ProfileScreen email={user?.email ?? null} avatarUrl={profile?.avatar_url ?? null} />
      <BottomNav />
    </AuthGuard>
  );
}
