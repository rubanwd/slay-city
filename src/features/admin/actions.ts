"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  revalidatePath("/map", "layout");
  redirect("/admin/missions");
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

  revalidatePath("/admin/missions");
  return { success: "Task added." };
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

  if (!districtId) return { error: "Choose a district for this location." };
  if (!name) return { error: "Location name is required." };
  if (orderIndex === null) return { error: "Order must be a non-negative whole number." };

  const { error } = await supabase.from("locations").insert({
    district_id: districtId,
    name,
    description: description || null,
    order_index: orderIndex,
    is_published: isPublished,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/districts/new");
  revalidatePath("/map", "layout");
  return { success: `Location "${name}" created.` };
}
