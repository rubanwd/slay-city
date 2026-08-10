import type { KnowledgeLevel, UserRole } from "@/types";

import type { SupabaseServerClient } from "./requireAdmin";

/** One account as the admin user list shows it. */
export interface AdminUserView {
  id: string;
  /** Null until the account finishes onboarding — it has no profile row yet. */
  username: string | null;
  email: string | null;
  role: UserRole | null;
  level: KnowledgeLevel | null;
  createdAt: string;
  hasProfile: boolean;
  isConfirmed: boolean;
}

export interface AdminUserListResult {
  users: AdminUserView[];
  /** Accounts matching the filters, ignoring the page limit. */
  total: number;
}

export interface ListAdminUsersOptions {
  /** Matches against email or username, case-insensitively. */
  search?: string;
  role?: UserRole;
  limit?: number;
  offset?: number;
}

/** How many accounts one page of the admin user list shows. */
export const ADMIN_USERS_PAGE_SIZE = 50;

/**
 * Every account, newest first, backed by the `admin_list_users()` SECURITY
 * DEFINER RPC — the only way to read the emails, which live in `auth.users`.
 * Returns an empty list for anyone who isn't an admin.
 */
export async function listAdminUsers(
  supabase: SupabaseServerClient,
  { search, role, limit = ADMIN_USERS_PAGE_SIZE, offset = 0 }: ListAdminUsersOptions = {}
): Promise<AdminUserListResult> {
  // Omitted arguments fall back to the RPC's own defaults (null = no filter).
  const { data } = await supabase.rpc("admin_list_users", {
    p_search: search?.trim() || undefined,
    p_role: role ?? undefined,
    p_limit: limit,
    p_offset: offset,
  });

  const rows = data ?? [];

  return {
    users: rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      level: row.level,
      createdAt: row.created_at,
      hasProfile: row.has_profile,
      isConfirmed: row.is_confirmed,
    })),
    // Every row carries the same window count; an empty page means no matches.
    total: rows.length > 0 ? Number(rows[0].total_count) : 0,
  };
}
