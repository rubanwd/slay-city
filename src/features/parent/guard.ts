import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface RequireParentPageResult {
  supabase: SupabaseServerClient;
  /** The signed-in adult's profile id — the parent (or an admin looking in). */
  profileId: string;
  email: string | null;
  /** Student account this parent registered with, from their auth metadata. */
  studentEmail: string | null;
}

/**
 * Server-side guard for the parent console: the caller must be signed in and
 * hold a non-student profile. Middleware enforces the same rule, but keeping it
 * here means the pages are safe even if the matcher ever changes. Mirrors
 * {@link file://../teacher/guard.ts}.
 */
export async function requireParentPage(): Promise<RequireParentPageResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  // A student (or a user who never finished onboarding) has no business here.
  if (!profile || profile.role === "student") {
    redirect("/map");
  }

  return {
    supabase,
    profileId: profile.id,
    email: user.email ?? null,
    studentEmail:
      typeof user.user_metadata?.student_email === "string"
        ? user.user_metadata.student_email
        : null,
  };
}
