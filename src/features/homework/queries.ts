import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface MyGroup {
  groupId: string;
  groupName: string;
  teacherId: string;
}

/**
 * The groups the signed-in child belongs to. Backed by the `my_groups()`
 * SECURITY DEFINER RPC — a child has no direct SELECT on `teacher_group_members`
 * (see `20260720000009_homework.sql`), so this is the only way to read it.
 */
export async function getMyGroups(supabase: SupabaseServerClient): Promise<MyGroup[]> {
  const { data } = await supabase.rpc("my_groups");
  return (data ?? []).map((row) => ({
    groupId: row.group_id,
    groupName: row.group_name,
    teacherId: row.teacher_id,
  }));
}

/** Whether the child belongs to at least one teacher group — gates the Homework nav tab. */
export async function hasAnyGroup(supabase: SupabaseServerClient): Promise<boolean> {
  const groups = await getMyGroups(supabase);
  return groups.length > 0;
}
