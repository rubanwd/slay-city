"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { isKnowledgeLevel, knowledgeLevelLabel } from "./levels";

export type ChangeLevelResult = { ok: true } | { ok: false; error: string };

/**
 * Switches the signed-in child to another knowledge level, changing which
 * districts their map shows. Progress is per-mission, so nothing is lost:
 * switching back restores exactly what they had finished there.
 *
 * The "is this level actually available?" rule lives in
 * `set_my_knowledge_level` (SECURITY DEFINER), so a hand-crafted request can't
 * park a child on an empty level.
 */
export async function changeMyLevel(level: string): Promise<ChangeLevelResult> {
  if (!isKnowledgeLevel(level)) {
    return { ok: false, error: "Pick a level from the list." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to change your level." };
  }

  const { error } = await supabase.rpc("set_my_knowledge_level", { p_level: level });
  if (error) {
    return {
      ok: false,
      error: `Couldn't switch to ${knowledgeLevelLabel(level)}. ${error.message}`,
    };
  }

  // The map, profile, and nav all read the level — refresh everything.
  revalidatePath("/", "layout");
  return { ok: true };
}
