/**
 * Name of the cookie that caches the signed-in player's current mascot image
 * (their most recently equipped wardrobe item's artwork, or the default snake).
 * Kept in its own runtime-import-free module, mirroring `viewAsCookie.ts`, so it
 * can be referenced without pulling in `next/headers`.
 */
export const MASCOT_IMAGE_COOKIE = "slay_mascot_image";
