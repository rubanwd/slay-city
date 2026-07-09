"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/** State returned to admin forms via useActionState. */
export type AdminFormState = {
  error?: string;
  success?: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type MissionTaskType = Database["public"]["Enums"]["mission_task_type"];

const MISSION_TASK_TYPES: MissionTaskType[] = ["vocabulary", "matching", "listening", "quiz"];

/**
 * Confirms the caller is a signed-in admin before any write. RLS on the content
 * tables independently restricts writes to admins (`*_insert/update_admin`
 * policies), so this is defence-in-depth plus a friendly error message.
 */
async function requireAdmin(
  supabase: SupabaseServerClient
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
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

/** Parses a non-negative integer from a form field, defaulting to `fallback`. */
function parseNonNegativeInt(raw: FormDataEntryValue | null, fallback = 0): number | null {
  const value = String(raw ?? "").trim();
  if (value === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

/**
 * Parses an optional 0–100 map coordinate (percent position on the city map).
 * Empty input is allowed and means "use the map's default center" — returns
 * `null`. Returns `undefined` when the value is present but not a number in
 * range, so the caller can distinguish "omitted" from "invalid".
 */
function parsePercentCoordinate(raw: FormDataEntryValue | null): number | null | undefined {
  const value = String(raw ?? "").trim();
  if (value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) return undefined;
  return n;
}

/* ── Missions ──────────────────────────────────────────────────────────────── */

export async function createMission(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const locationId = String(formData.get("location_id") ?? "").trim();
  const xpReward = parseNonNegativeInt(formData.get("xp_reward"));
  const coinReward = parseNonNegativeInt(formData.get("coin_reward"));
  const isPublished = formData.get("is_published") === "on";

  if (!title) return { error: "Title is required." };
  if (!locationId) return { error: "Choose a location for this mission." };
  if (xpReward === null) return { error: "XP reward must be a non-negative whole number." };
  if (coinReward === null) return { error: "Coin reward must be a non-negative whole number." };

  const { error } = await supabase.from("missions").insert({
    title,
    description: description || null,
    location_id: locationId,
    xp_reward: xpReward,
    coin_reward: coinReward,
    is_published: isPublished,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/missions");
  revalidatePath("/admin/districts/new");
  revalidatePath("/map", "layout");
  return { success: `Mission "${title}" created.` };
}

/** Updates a mission's title, description, location, rewards, and published flag. */
export async function updateMission(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const locationId = String(formData.get("location_id") ?? "").trim();
  const xpReward = parseNonNegativeInt(formData.get("xp_reward"));
  const coinReward = parseNonNegativeInt(formData.get("coin_reward"));
  const isPublished = formData.get("is_published") === "on";

  if (!id) return { error: "A mission is required." };
  if (!title) return { error: "Title is required." };
  if (!locationId) return { error: "Choose a location for this mission." };
  if (xpReward === null) return { error: "XP reward must be a non-negative whole number." };
  if (coinReward === null) return { error: "Coin reward must be a non-negative whole number." };

  const { error } = await supabase
    .from("missions")
    .update({
      title,
      description: description || null,
      location_id: locationId,
      xp_reward: xpReward,
      coin_reward: coinReward,
      is_published: isPublished,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/missions");
  revalidatePath("/admin/districts/new");
  revalidatePath("/map", "layout");
  return { success: `Mission "${title}" updated.` };
}

/** Flips a mission's published flag. Backing the publish/unpublish list buttons. */
async function setMissionPublished(missionId: string, isPublished: boolean): Promise<void> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return;

  const { error } = await supabase
    .from("missions")
    .update({ is_published: isPublished })
    .eq("id", missionId);

  if (!error) {
    revalidatePath("/admin/missions");
    // Published state changes what appears on the player-facing map.
    revalidatePath("/map", "layout");
  }
}

export async function publishMission(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (id) await setMissionPublished(id, true);
}

export async function unpublishMission(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (id) await setMissionPublished(id, false);
}

/* ── Mission tasks ─────────────────────────────────────────────────────────── */

/**
 * Adds a task (vocabulary/matching/listening/quiz) to a mission. `content` is
 * free-form JSON stored on the row; callers pass it as a JSON string.
 */
export async function createMissionTask(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const missionId = String(formData.get("mission_id") ?? "").trim();
  const taskType = String(formData.get("task_type") ?? "").trim() as MissionTaskType;
  const orderIndex = parseNonNegativeInt(formData.get("order_index"));
  const contentRaw = String(formData.get("content") ?? "").trim();

  if (!missionId) return { error: "A mission is required." };
  if (!MISSION_TASK_TYPES.includes(taskType)) {
    return { error: "Choose a valid task type." };
  }
  if (orderIndex === null) return { error: "Order must be a non-negative whole number." };

  let content: Database["public"]["Tables"]["mission_tasks"]["Insert"]["content"] = {};
  if (contentRaw) {
    try {
      content = JSON.parse(contentRaw);
    } catch {
      return { error: "Content must be valid JSON." };
    }
  }

  const { error } = await supabase.from("mission_tasks").insert({
    mission_id: missionId,
    task_type: taskType,
    order_index: orderIndex,
    content,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/missions/${missionId}/tasks`);
  return { success: "Task added." };
}

/** Updates a task's type, order, and content. */
export async function updateMissionTask(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const taskId = String(formData.get("id") ?? "").trim();
  const missionId = String(formData.get("mission_id") ?? "").trim();
  const taskType = String(formData.get("task_type") ?? "").trim() as MissionTaskType;
  const orderIndex = parseNonNegativeInt(formData.get("order_index"));
  const contentRaw = String(formData.get("content") ?? "").trim();

  if (!taskId) return { error: "A task is required." };
  if (!missionId) return { error: "A mission is required." };
  if (!MISSION_TASK_TYPES.includes(taskType)) {
    return { error: "Choose a valid task type." };
  }
  if (orderIndex === null) return { error: "Order must be a non-negative whole number." };

  let content: Database["public"]["Tables"]["mission_tasks"]["Update"]["content"] = {};
  if (contentRaw) {
    try {
      content = JSON.parse(contentRaw);
    } catch {
      return { error: "Content must be valid JSON." };
    }
  }

  const { error } = await supabase
    .from("mission_tasks")
    .update({ task_type: taskType, order_index: orderIndex, content })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/missions/${missionId}/tasks`);
  revalidatePath("/map", "layout");
  return { success: "Task updated." };
}

/** Deletes a task from a mission. */
export async function deleteMissionTask(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return;

  const taskId = String(formData.get("id") ?? "").trim();
  const missionId = String(formData.get("mission_id") ?? "").trim();
  if (!taskId || !missionId) return;

  const { error } = await supabase.from("mission_tasks").delete().eq("id", taskId);

  if (!error) {
    revalidatePath(`/admin/missions/${missionId}/tasks`);
    revalidatePath("/map", "layout");
  }
}

/** Flips a task's published flag. Only published tasks appear in gameplay. */
async function setTaskPublished(
  taskId: string,
  missionId: string,
  isPublished: boolean
): Promise<void> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return;

  const { error } = await supabase
    .from("mission_tasks")
    .update({ is_published: isPublished })
    .eq("id", taskId);

  if (!error) {
    revalidatePath(`/admin/missions/${missionId}/tasks`);
    // Published tasks are what the player actually plays through.
    revalidatePath("/map", "layout");
  }
}

export async function publishMissionTask(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const missionId = String(formData.get("mission_id") ?? "").trim();
  if (id && missionId) await setTaskPublished(id, missionId, true);
}

export async function unpublishMissionTask(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const missionId = String(formData.get("mission_id") ?? "").trim();
  if (id && missionId) await setTaskPublished(id, missionId, false);
}

/* ── Admin allow-list ──────────────────────────────────────────────────────── */

/** Loose email shape check — real validation happens at auth time. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Adds an email to the admin allow-list. Anyone on the list becomes an admin on
 * their next login/registration (see `claim_admin`). Stored lower-cased so the
 * list has no case-duplicate rows.
 */
export async function addAdminEmail(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Enter an email." };
  if (!EMAIL_PATTERN.test(email)) return { error: "Enter a valid email address." };

  const { error } = await supabase.from("admin_emails").insert({ email });
  if (error) {
    // 23505 = unique_violation — already on the list, treat as success.
    if (error.code === "23505") {
      return { success: `${email} is already an admin.` };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/admins");
  return { success: `${email} can now sign in as an admin.` };
}

/** Removes an email from the allow-list. Does not demote an already-granted
 * admin profile — that stays until the role is changed directly. */
export async function removeAdminEmail(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return;

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return;

  const { error } = await supabase.from("admin_emails").delete().eq("email", email);
  if (!error) revalidatePath("/admin/admins");
}

/* ── Districts & locations ─────────────────────────────────────────────────── */

export async function createDistrict(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const orderIndex = parseNonNegativeInt(formData.get("order_index"));
  const isPublished = formData.get("is_published") === "on";

  if (!name) return { error: "District name is required." };
  if (orderIndex === null) return { error: "Order must be a non-negative whole number." };

  const { error } = await supabase.from("districts").insert({
    name,
    description: description || null,
    order_index: orderIndex,
    is_published: isPublished,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/districts/new");
  revalidatePath("/map", "layout");
  return { success: `District "${name}" created.` };
}

/** Updates a district's name, description, order, and published flag. */
export async function updateDistrict(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const orderIndex = parseNonNegativeInt(formData.get("order_index"));
  const isPublished = formData.get("is_published") === "on";

  if (!id) return { error: "A district is required." };
  if (!name) return { error: "District name is required." };
  if (orderIndex === null) return { error: "Order must be a non-negative whole number." };

  const { error } = await supabase
    .from("districts")
    .update({
      name,
      description: description || null,
      order_index: orderIndex,
      is_published: isPublished,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/districts/new");
  revalidatePath("/map", "layout");
  return { success: `District "${name}" updated.` };
}

export async function createLocation(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const districtId = String(formData.get("district_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const orderIndex = parseNonNegativeInt(formData.get("order_index"));
  const isPublished = formData.get("is_published") === "on";
  const mapX = parsePercentCoordinate(formData.get("map_x"));
  const mapY = parsePercentCoordinate(formData.get("map_y"));

  if (!districtId) return { error: "Choose a district for this location." };
  if (!name) return { error: "Location name is required." };
  if (orderIndex === null) return { error: "Order must be a non-negative whole number." };
  if (mapX === undefined) return { error: "Map X must be a number between 0 and 100." };
  if (mapY === undefined) return { error: "Map Y must be a number between 0 and 100." };

  const { error } = await supabase.from("locations").insert({
    district_id: districtId,
    name,
    description: description || null,
    order_index: orderIndex,
    is_published: isPublished,
    map_x: mapX,
    map_y: mapY,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/districts/new");
  revalidatePath("/map", "layout");
  return { success: `Location "${name}" created.` };
}

/** Updates a location's district, name, description, order, map position, and published flag. */
export async function updateLocation(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const id = String(formData.get("id") ?? "").trim();
  const districtId = String(formData.get("district_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const orderIndex = parseNonNegativeInt(formData.get("order_index"));
  const isPublished = formData.get("is_published") === "on";
  const mapX = parsePercentCoordinate(formData.get("map_x"));
  const mapY = parsePercentCoordinate(formData.get("map_y"));

  if (!id) return { error: "A location is required." };
  if (!districtId) return { error: "Choose a district for this location." };
  if (!name) return { error: "Location name is required." };
  if (orderIndex === null) return { error: "Order must be a non-negative whole number." };
  if (mapX === undefined) return { error: "Map X must be a number between 0 and 100." };
  if (mapY === undefined) return { error: "Map Y must be a number between 0 and 100." };

  const { error } = await supabase
    .from("locations")
    .update({
      district_id: districtId,
      name,
      description: description || null,
      order_index: orderIndex,
      is_published: isPublished,
      map_x: mapX,
      map_y: mapY,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/districts/new");
  revalidatePath("/map", "layout");
  return { success: `Location "${name}" updated.` };
}
