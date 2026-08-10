import NavLink from "@/components/ui/NavLink";
import { SlayButton } from "@/components/ui";

import AdminAddUserForm from "@/features/admin/AdminAddUserForm";
import AdminCreateModal from "@/features/admin/AdminCreateModal";
import AdminHeader from "@/features/admin/AdminHeader";
import AdminUserItem from "@/features/admin/AdminUserItem";
import { INPUT_CLASS } from "@/features/admin/formStyles";
import { requireAdminPage } from "@/features/admin/guard";
import { ADMIN_USERS_PAGE_SIZE, listAdminUsers } from "@/features/admin/userQueries";
import { USER_ROLES, USER_ROLE_LABELS, isUserRole } from "@/features/admin/userRoles";

interface ManageUsersPageProps {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}

/** Builds a link to another page of the same filtered list. */
function pageHref(query: string, role: string, page: number): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (role) params.set("role", role);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/admin/users?${search}` : "/admin/users";
}

/**
 * Every account in one place at `/admin/users`: username, email and join date,
 * with the two controls the other admin screens don't offer — change any
 * account's role, or delete it outright. Emails come from `auth.users`, so the
 * whole list is served by the `admin_list_users()` RPC rather than a table read.
 */
export default async function ManageUsersPage({ searchParams }: ManageUsersPageProps) {
  const { q, role: roleParam, page: pageParam } = await searchParams;
  const { supabase, user } = await requireAdminPage();

  const query = (q ?? "").trim();
  const role = isUserRole(roleParam) ? roleParam : undefined;
  const page = Math.max(1, Number(pageParam) || 1);

  const { users, total } = await listAdminUsers(supabase, {
    search: query,
    role,
    limit: ADMIN_USERS_PAGE_SIZE,
    offset: (page - 1) * ADMIN_USERS_PAGE_SIZE,
  });

  const firstShown = total === 0 ? 0 : (page - 1) * ADMIN_USERS_PAGE_SIZE + 1;
  const lastShown = (page - 1) * ADMIN_USERS_PAGE_SIZE + users.length;
  const hasPrev = page > 1;
  const hasNext = lastShown < total;
  const isFiltered = Boolean(query || role);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Manage Users" backHref="/admin" />

        <div className="mb-6">
          <AdminCreateModal triggerLabel="Add User" title="Add User">
            <AdminAddUserForm />
          </AdminCreateModal>
        </div>

        <form method="get" className="mb-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by email or username"
              className={INPUT_CLASS}
            />
            <SlayButton type="submit" variant="ghost" size="md">
              Search
            </SlayButton>
          </div>
          <select name="role" defaultValue={role ?? ""} className={INPUT_CLASS}>
            <option value="" className="bg-[#1a1a1a]">
              All roles
            </option>
            {USER_ROLES.map((value) => (
              <option key={value} value={value} className="bg-[#1a1a1a]">
                {USER_ROLE_LABELS[value]}s only
              </option>
            ))}
          </select>
        </form>

        <h2 className="mb-2 text-label text-white/50">
          {total === 0
            ? "Users (0)"
            : `Users ${firstShown}–${lastShown} of ${total}${isFiltered ? " matching" : ""}`}
        </h2>

        {users.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            {isFiltered ? "No accounts match those filters." : "No accounts yet."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {users.map((row) => (
              <AdminUserItem key={row.id} user={row} isSelf={row.id === user.id} />
            ))}
          </ul>
        )}

        {(hasPrev || hasNext) && (
          <nav className="mt-4 flex items-center justify-between gap-3">
            {hasPrev ? (
              <NavLink
                href={pageHref(query, role ?? "", page - 1)}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/70 transition-colors hover:bg-white/10"
              >
                Previous
              </NavLink>
            ) : (
              <span />
            )}
            {hasNext && (
              <NavLink
                href={pageHref(query, role ?? "", page + 1)}
                className="ml-auto rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/70 transition-colors hover:bg-white/10"
              >
                Next
              </NavLink>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
