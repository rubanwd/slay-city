/**
 * Resolves which image represents the player's mascot given their currently
 * equipped wardrobe items.
 *
 * The mascot is a single image, but items span several categories (hat,
 * glasses, accessory, color). Rather than compositing, we show the preview of
 * the item the player equipped most recently — "what I just put on shows" — and
 * fall back to the default snake when nothing equipped has artwork.
 */

/** Default mascot art shown when no equipped item provides its own preview. */
export const DEFAULT_MASCOT_IMAGE = "/slay_snake.svg";

export type EquippedMascotItem = {
  /** Dedicated "mascot wearing this item" art. */
  previewUrl: string | null;
  /** Catalog thumbnail, used when no dedicated preview exists. */
  imageUrl: string | null;
  /** When the item was equipped (ISO string), or null if unknown. */
  equippedAt: string | null;
};

/**
 * Returns the mascot image URL for a set of equipped items. Picks the most
 * recently equipped item that has any artwork (`preview_url` first, then
 * `image_url`); if none do, returns {@link DEFAULT_MASCOT_IMAGE}.
 */
export function resolveMascotImage(items: EquippedMascotItem[]): string {
  const byMostRecent = [...items].sort((a, b) => {
    const ta = a.equippedAt ? Date.parse(a.equippedAt) : 0;
    const tb = b.equippedAt ? Date.parse(b.equippedAt) : 0;
    return tb - ta;
  });

  for (const item of byMostRecent) {
    const url = item.previewUrl ?? item.imageUrl;
    if (url) return url;
  }

  return DEFAULT_MASCOT_IMAGE;
}
