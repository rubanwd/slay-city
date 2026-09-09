import AdminAddTeacherForm from "@/features/admin/AdminAddTeacherForm";
import AdminCreateModal from "@/features/admin/AdminCreateModal";
import AdminHeader from "@/features/admin/AdminHeader";
import TeacherListItem from "@/features/admin/TeacherListItem";
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
              <TeacherListItem
                key={row.id}
                id={row.id}
                username={row.username}
                groupCount={groupCounts.get(row.id) ?? 0}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
