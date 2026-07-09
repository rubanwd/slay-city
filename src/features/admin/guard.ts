import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Server-side guard for admin pages. Middleware already keeps non-admins out of
 * `/admin`, but enforcing it here too means the pages are safe even if the
 * matcher ever changes. Returns the authenticated supabase client for reuse.
 */
export async function requireAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/map");
  }

  return { supabase, user };
}
