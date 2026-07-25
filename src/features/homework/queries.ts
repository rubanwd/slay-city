import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface MyGroup {
  groupId: string;
  groupName: string;
  teacherId: string;
  teacherUsername: string;
}

/**
 * The groups the signed-in student belongs to. Backed by the `my_groups()`
 * SECURITY DEFINER RPC — a student has no direct SELECT on `teacher_group_members`
 * or another user's `profiles` row (see `20260720000009_homework.sql` and
 * `20260720000011_my_groups_teacher_name.sql`), so this is the only way to
 * read either.
 */
export async function getMyGroups(supabase: SupabaseServerClient): Promise<MyGroup[]> {
  const { data } = await supabase.rpc("my_groups");
  return (data ?? []).map((row) => ({
    groupId: row.group_id,
    groupName: row.group_name,
    teacherId: row.teacher_id,
    teacherUsername: row.teacher_username,
  }));
}

/** Whether the student belongs to at least one teacher group — gates the Homework nav tab. */
export async function hasAnyGroup(supabase: SupabaseServerClient): Promise<boolean> {
  const groups = await getMyGroups(supabase);
  return groups.length > 0;
}
