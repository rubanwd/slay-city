import type { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** One report as the admin inbox shows it, with its author resolved. */
export interface FeedbackReportView {
  id: string;
  authorId: string;
  authorUsername: string | null;
  authorRole: UserRole | null;
  kind: string;
  message: string;
  imageUrls: string[];
  createdAt: string;
  isRead: boolean;
}

/**
 * Every report, newest first, for the signed-in admin. Backed by the
 * `list_feedback_reports()` SECURITY DEFINER RPC, which resolves the author's
 * name and whether *this* admin has read the report. Returns an empty list for
 * anyone who isn't an admin.
 */
export async function listFeedbackReports(
  supabase: SupabaseServerClient
): Promise<FeedbackReportView[]> {
  const { data } = await supabase.rpc("list_feedback_reports");
  return (data ?? []).map((row) => ({
    id: row.id,
    authorId: row.author_id,
    authorUsername: row.author_username,
    authorRole: row.author_role,
    kind: row.kind,
    message: row.message,
    imageUrls: row.image_urls ?? [],
    createdAt: row.created_at,
    isRead: row.is_read,
  }));
}

/**
 * How many reports the signed-in admin hasn't opened yet — the number on the
 * badge beside the console's Feedback & Bugs section. 0 for non-admins.
 */
export async function getUnreadFeedbackCount(supabase: SupabaseServerClient): Promise<number> {
  const { data } = await supabase.rpc("unread_feedback_count");
  return data ?? 0;
}
