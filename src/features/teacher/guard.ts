import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/features/auth/roleRouting";

/**
 * Server-side guard for the teacher dashboard. Middleware already keeps
 * non-teachers out of `/teacher`, but enforcing it here too means the page is
 * safe even if the matcher ever changes. Returns the authenticated supabase
 * client for reuse.
 */
export async function requireTeacherPage() {
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

  if (profile?.role !== "teacher") {
    redirect(roleHome(profile?.role));
  }

  return { supabase, user };
}
