import type { createClient } from "@/lib/supabase/server";
import type { KnowledgeLevel } from "@/types";

import { isKnowledgeLevel, sortKnowledgeLevels, DEFAULT_KNOWLEDGE_LEVEL } from "./levels";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * The levels a child is allowed to pick right now: those with at least one
 * published district that has at least one published location. Backed by the
 * `available_knowledge_levels()` SECURITY DEFINER RPC, so the answer is the
 * same for a child and an admin (see
 * `supabase/migrations/20260724000004_knowledge_levels.sql`).
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
 * The level the signed-in child is studying. Falls back to the default level
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
