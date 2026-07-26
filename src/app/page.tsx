import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/features/auth/roleRouting";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // Each role has its own home — admins must land in the console, not the map.
    redirect(profile ? roleHome(profile.role) : "/onboarding");
  }

  // Everyone else starts by playing: the signed-out demo map, not a login form.
  // The app only asks who they are once they've finished a location (see
  // `src/features/demo/`).
  redirect("/demo");
}
