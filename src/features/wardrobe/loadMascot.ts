import { cookies } from "next/headers";

import { DEFAULT_MASCOT_IMAGE, resolveMascotImage } from "@/features/wardrobe/mascot";
import { createClient } from "@/lib/supabase/server";

import { MASCOT_IMAGE_COOKIE } from "./mascotCookie";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** How long the cached mascot image cookie lives before it needs refreshing. */
const MASCOT_IMAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

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

/**
 * Caches the resolved mascot image in a cookie so instant route-transition
 * fallbacks (`loading.tsx`) can show the player's actual equipped look without
 * a DB round trip. Call this from the equip/unequip Server Actions, right after
 * the change takes effect — cookies can only be written there or in Route
 * Handlers, never during a Server Component render.
 */
export async function writeMascotImageCookie(imageUrl: string): Promise<void> {
  const store = await cookies();
  store.set(MASCOT_IMAGE_COOKIE, imageUrl, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MASCOT_IMAGE_COOKIE_MAX_AGE,
  });
}

/**
 * Reads the cached mascot image cookie for use in a `loading.tsx` fallback.
 * Falls back to the default snake if the cookie is missing, or if its value
 * doesn't look like a same-origin path or an https URL (defensive against a
 * tampered cookie being fed straight into an `<img src>`).
 */
export async function readMascotImageCookie(): Promise<string> {
  const store = await cookies();
  const value = store.get(MASCOT_IMAGE_COOKIE)?.value;
  if (value && (value.startsWith("/") || value.startsWith("https://"))) {
    return value;
  }
  return DEFAULT_MASCOT_IMAGE;
}
