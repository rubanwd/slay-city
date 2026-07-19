import { resolveMascotImage } from "@/features/wardrobe/mascot";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Loads the mascot image for a player: the artwork of their most recently
 * equipped wardrobe item, or the default snake when nothing equipped has art.
 * Shared by every surface that shows "your" character (map marker, wardrobe
 * preview, profile avatar) so they never drift apart.
 */
export async function loadMascotImage(
  supabase: SupabaseServerClient,
  profileId: string
): Promise<string> {
  const { data } = await supabase
    .from("user_wardrobe_items")
    .select("equipped_at, wardrobe_items(preview_url, image_url)")
    .eq("profile_id", profileId)
    .eq("equipped", true);

  return resolveMascotImage(
    (data ?? []).map((row) => {
      // The FK relationship comes back as a single related row (or null).
      const item = row.wardrobe_items as {
        preview_url: string | null;
        image_url: string | null;
      } | null;
      return {
        previewUrl: item?.preview_url ?? null,
        imageUrl: item?.image_url ?? null,
        equippedAt: row.equipped_at,
      };
    })
  );
}
