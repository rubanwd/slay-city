import NavLink from "@/components/ui/NavLink";

import AdminAddTeacherForm from "@/features/admin/AdminAddTeacherForm";
import AdminCreateModal from "@/features/admin/AdminCreateModal";
import AdminHeader from "@/features/admin/AdminHeader";
import { revokeTeacher } from "@/features/admin/actions";
import { requireAdminPage } from "@/features/admin/guard";

/**
 * Manage teacher accounts: promote an existing account to Teacher, revoke it
 * back to Parent, and jump into each teacher's groups.
 */
export default async function ManageTeachersPage() {
  const { supabase } = await requireAdminPage();

  const [teachersRes, groupsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, created_at")
      .eq("role", "teacher")
      .order("created_at", { ascending: false }),
    supabase.from("teacher_groups").select("teacher_id"),
  ]);

  const groupCounts = new Map<string, number>();
  for (const row of groupsRes.data ?? []) {
    groupCounts.set(row.teacher_id, (groupCounts.get(row.teacher_id) ?? 0) + 1);
  }

  const rows = teachersRes.data ?? [];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Manage Teachers" backHref="/admin" />

        <div className="mb-6">
          <AdminCreateModal triggerLabel="Add Teacher" title="Add Teacher">
            <AdminAddTeacherForm />
          </AdminCreateModal>
        </div>

        <h2 className="mb-2 text-label text-white/50">Teachers ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No teachers yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3"
              >
                <NavLink href={`/admin/teachers/${row.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-body-strong text-white">
                    {row.username}
                  </span>
                  <span className="text-small text-white/50">
                    {groupCounts.get(row.id) ?? 0}{" "}
                    {(groupCounts.get(row.id) ?? 0) === 1 ? "group" : "groups"}
                  </span>
                </NavLink>
                <form action={revokeTeacher} className="shrink-0">
                  <input type="hidden" name="profile_id" value={row.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-neon-pink/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10"
                  >
                    Revoke
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
