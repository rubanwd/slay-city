import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/features/auth/roleRouting";

import { resolveTeacherContext, type TeacherContext } from "./viewAs";

export type RequireTeacherPageResult = { supabase: Awaited<ReturnType<typeof createClient>> } & TeacherContext;

/**
 * Server-side guard for the teacher console. Resolves the effective teacher
 * (own id for a teacher, or the impersonated teacher for an admin who is
 * "viewing as" one) and returns it alongside the authenticated supabase client.
 * Anyone who is neither is redirected to their own home. Middleware enforces the
 * same rule, but keeping it here means the pages are safe even if the matcher
 * ever changes.
 */
export async function requireTeacherPage(): Promise<RequireTeacherPageResult> {
  const supabase = await createClient();

  const context = await resolveTeacherContext(supabase);
  if (context) {
    return { supabase, ...context };
  }

  // Not a teacher and not an admin impersonating one — send them home.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  redirect(roleHome(profile?.role));
}
