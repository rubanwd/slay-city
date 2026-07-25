import type { createClient } from "@/lib/supabase/server";
import type { KnowledgeLevel } from "@/types";

import { isKnowledgeLevel, sortKnowledgeLevels, DEFAULT_KNOWLEDGE_LEVEL } from "./levels";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * The levels a student is allowed to pick right now: those with at least one
 * published district that has at least one published location. Backed by the
 * `available_knowledge_levels()` SECURITY DEFINER RPC, so the answer is the
 * same for a student and an admin (see
 * `supabase/migrations/20260724000010_knowledge_levels.sql`).
 *
 * Returns an empty list if the RPC fails — callers must handle "no level to
 * pick" anyway, since a fresh database has no published content at all.
 */
export async function getAvailableLevels(
  supabase: SupabaseServerClient
): Promise<KnowledgeLevel[]> {
  const { data } = await supabase.rpc("available_knowledge_levels");
  const levels = (data ?? []).filter(isKnowledgeLevel);
  return sortKnowledgeLevels(levels);
}

/**
 * Whether the profile has completed every published mission of every published
 * location of every published district in a level — the condition that
 * graduates a player to the next level (`advance_my_level_if_cleared`).
 *
 * A level with no published missions is never "cleared": there was nothing to
 * finish. Mirrors `knowledge_level_completed()` in SQL, which is what actually
 * decides the promotion; this is the read-side used to explain it on the
 * reward screen.
 */
export async function isLevelCleared(
  supabase: SupabaseServerClient,
  profileId: string,
  level: KnowledgeLevel
): Promise<boolean> {
  const { data: districts } = await supabase
    .from("districts")
    .select("id")
    .eq("level", level)
    .eq("is_published", true);

  const districtIds = (districts ?? []).map((district) => district.id);
  if (districtIds.length === 0) return false;

  const { data: locations } = await supabase
    .from("locations")
    .select("id")
    .in("district_id", districtIds)
    .eq("is_published", true);

  const locationIds = (locations ?? []).map((location) => location.id);
  if (locationIds.length === 0) return false;

  const { data: missions } = await supabase
    .from("missions")
    .select("id")
    .in("location_id", locationIds)
    .eq("is_published", true);

  const missionIds = (missions ?? []).map((mission) => mission.id);
  if (missionIds.length === 0) return false;

  const { data: progress } = await supabase
    .from("user_progress")
    .select("mission_id, completed_at")
    .eq("profile_id", profileId)
    .in("mission_id", missionIds);

  const completed = new Set(
    (progress ?? []).filter((row) => row.completed_at !== null).map((row) => row.mission_id)
  );

  return missionIds.every((id) => completed.has(id));
}

/**
 * The level the signed-in student is studying. Falls back to the default level
 * for profiles that predate this column or when the profile row is missing.
 */
export async function getMyLevel(
  supabase: SupabaseServerClient,
  profileId: string
): Promise<KnowledgeLevel> {
  const { data } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", profileId)
    .maybeSingle();

  return isKnowledgeLevel(data?.level) ? data.level : DEFAULT_KNOWLEDGE_LEVEL;
}
