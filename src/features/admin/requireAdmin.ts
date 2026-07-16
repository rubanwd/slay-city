import type { createClient } from "@/lib/supabase/server";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type RequireAdminResult = { ok: true; userId: string } | { ok: false; error: string };

/**
 * Confirms the caller is a signed-in admin before any write. RLS on the content
 * tables independently restricts writes to admins (`*_insert/update_admin`
 * policies), so this is defence-in-depth plus a friendly error message.
 */
export async function requireAdmin(supabase: SupabaseServerClient): Promise<RequireAdminResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { ok: false, error: "Only admins can manage content." };
  }
  return { ok: true, userId: user.id };
}
