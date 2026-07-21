import { redirect } from "next/navigation";

import AdminAddGroupForm from "@/features/admin/AdminAddGroupForm";
import AdminCreateModal from "@/features/admin/AdminCreateModal";
import AdminHeader from "@/features/admin/AdminHeader";
import { addGroupMember, deleteTeacherGroup, removeGroupMember } from "@/features/admin/actions";
import { INPUT_CLASS } from "@/features/admin/formStyles";
import { requireAdminPage } from "@/features/admin/guard";
import { enterViewAsTeacher } from "@/features/teacher/viewAsActions";
import { SlayButton } from "@/components/ui";

interface TeacherGroupsPageProps {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<{ q?: string }>;
}

/**
 * One teacher's groups: create/delete groups, and assign/remove existing
 * `child` accounts. Group CRUD is plain admin-gated table access (no RPC
 * needed — unlike the role change itself, these tables don't touch `profiles`).
 */
export default async function TeacherGroupsPage({ params, searchParams }: TeacherGroupsPageProps) {
  const { teacherId } = await params;
  const { q } = await searchParams;
  const { supabase } = await requireAdminPage();

  const { data: teacher } = await supabase
    .from("profiles")
    .select("id, username, role")
    .eq("id", teacherId)
    .maybeSingle();

  if (!teacher || teacher.role !== "teacher") {
    redirect("/admin/teachers");
  }

  const { data: groups } = await supabase
    .from("teacher_groups")
    .select("id, name")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: true });

  const groupRows = groups ?? [];

  const { data: members } = await supabase
    .from("teacher_group_members")
    .select("group_id, child_id, profiles(username)")
    .in(
      "group_id",
      groupRows.map((group) => group.id)
    );

  const membersByGroup = new Map<string, { childId: string; username: string }[]>();
  for (const row of members ?? []) {
    const list = membersByGroup.get(row.group_id) ?? [];
    list.push({ childId: row.child_id, username: row.profiles?.username ?? "Unknown" });
    membersByGroup.set(row.group_id, list);
  }

  const query = (q ?? "").trim();
  let childResults: { id: string; username: string }[] = [];
  if (groupRows.length > 0) {
    let childrenQuery = supabase
      .from("profiles")
      .select("id, username")
      .eq("role", "child")
      .order("username", { ascending: true })
      .limit(20);
    if (query) childrenQuery = childrenQuery.ilike("username", `%${query}%`);
    const { data } = await childrenQuery;
    childResults = data ?? [];
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title={teacher.username} backHref="/admin/teachers" />

        <form action={enterViewAsTeacher} className="mb-4">
          <input type="hidden" name="teacher_id" value={teacherId} />
          <button
            type="submit"
            className="w-full rounded-full border border-cyan/50 px-4 py-2.5 text-small font-bold uppercase tracking-wide text-cyan transition-colors hover:bg-cyan/10"
          >
            View as Teacher
          </button>
        </form>

        <div className="mb-6">
          <AdminCreateModal triggerLabel="Add Group" title="Create Group">
            <AdminAddGroupForm teacherId={teacherId} />
          </AdminCreateModal>
        </div>

        {groupRows.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No groups yet. Create one to start assigning students.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {groupRows.map((group) => {
              const groupMembers = membersByGroup.get(group.id) ?? [];
              return (
                <section key={group.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 className="truncate text-label text-white/50">{group.name}</h2>
                    <form action={deleteTeacherGroup}>
                      <input type="hidden" name="group_id" value={group.id} />
                      <input type="hidden" name="teacher_id" value={teacherId} />
                      <button
                        type="submit"
                        className="shrink-0 rounded-full border border-neon-pink/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10"
                      >
                        Delete Group
                      </button>
                    </form>
                  </div>
                  {groupMembers.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4 text-center text-small text-white/50">
                      No students in this group yet.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {groupMembers.map((member) => (
                        <li
                          key={member.childId}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3"
                        >
                          <span className="min-w-0 truncate text-body-strong text-white">
                            {member.username}
                          </span>
                          <form action={removeGroupMember} className="shrink-0">
                            <input type="hidden" name="group_id" value={group.id} />
                            <input type="hidden" name="child_id" value={member.childId} />
                            <input type="hidden" name="teacher_id" value={teacherId} />
                            <button
                              type="submit"
                              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/60 transition-colors hover:bg-white/10"
                            >
                              Remove
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {groupRows.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 text-label text-white/50">Add a student</h2>
            <form method="get" className="mb-3 flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search students by username"
                className={INPUT_CLASS}
              />
              <SlayButton type="submit" variant="ghost" size="md">
                Search
              </SlayButton>
            </form>
            {childResults.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
                No matching students.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {childResults.map((child) => (
                  <li
                    key={child.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3"
                  >
                    <span className="min-w-0 truncate text-body-strong text-white">
                      {child.username}
                    </span>
                    <form action={addGroupMember} className="flex shrink-0 items-center gap-2">
                      <input type="hidden" name="child_id" value={child.id} />
                      <input type="hidden" name="teacher_id" value={teacherId} />
                      <select
                        name="group_id"
                        required
                        className="rounded-full border border-white/15 bg-black px-2.5 py-1.5 text-xs text-white"
                      >
                        {groupRows.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-full border border-lime-green/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-lime-green transition-colors hover:bg-lime-green/10"
                      >
                        Add
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
