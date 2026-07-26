"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Moves a location's label to a new spot on the city map.
 *
 * Coordinates are percentages of the map frame — the same space the admin
 * position picker and both maps use — so wherever the teacher taps is exactly
 * where students will see the label.
 *
 * Who may do this is decided in the database (`set_location_map_position`
 * accepts teachers and admins only); this action just carries the tap across.
 */
export async function moveLocationOnMap(
  locationId: string,
  mapX: number,
  mapY: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(mapX) || !Number.isFinite(mapY)) {
    return { ok: false, error: "That spot is off the map." };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("set_location_map_position", {
    p_location_id: locationId,
    p_map_x: mapX,
    p_map_y: mapY,
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  // The stop moves for everyone who can see it, not just the teacher who
  // dragged it: students play the same coordinates on `/map`, and parents watch
  // them on `/parent/map`.
  revalidatePath("/teacher/map", "layout");
  revalidatePath("/parent/map", "layout");
  revalidatePath("/map", "layout");
  return { ok: true };
}
