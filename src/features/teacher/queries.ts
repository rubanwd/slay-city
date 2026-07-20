import type { createClient } from "@/lib/supabase/server";
import { getParentProgressSummary, type ParentProgressSummary } from "@/features/parent/queries";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface TeacherGroupChild {
  id: string;
  username: string;
  progress: ParentProgressSummary;
}

export interface TeacherGroup {
  id: string;
  name: string;
  children: TeacherGroupChild[];
}

/**
 * Read-only groups + children progress for the teacher dashboard. Each
 * child's stats are fetched via the existing parent-dashboard query, which is
 * already generic on `profileId` — no teacher-specific stats logic needed.
 */
export async function getTeacherGroups(
  supabase: SupabaseServerClient,
  teacherId: string
): Promise<TeacherGroup[]> {
  const { data: groups } = await supabase
    .from("teacher_groups")
    .select("id, name, created_at")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: true });

  if (!groups || groups.length === 0) return [];

  const { data: members } = await supabase
    .from("teacher_group_members")
    .select("group_id, child_id, profiles(username)")
    .in(
      "group_id",
      groups.map((group) => group.id)
    );

  const membersByGroup = new Map<string, { childId: string; username: string }[]>();
  for (const row of members ?? []) {
    const list = membersByGroup.get(row.group_id) ?? [];
    list.push({ childId: row.child_id, username: row.profiles?.username ?? "Unknown" });
    membersByGroup.set(row.group_id, list);
  }

  return Promise.all(
    groups.map(async (group) => {
      const groupMembers = membersByGroup.get(group.id) ?? [];
      const children = await Promise.all(
        groupMembers.map(async (member) => ({
          id: member.childId,
          username: member.username,
          progress: await getParentProgressSummary(supabase, member.childId),
        }))
      );
      return { id: group.id, name: group.name, children };
    })
  );
}
