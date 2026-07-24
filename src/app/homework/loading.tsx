import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { readMascotImageCookie } from "@/features/wardrobe/loadMascot";

/**
 * Route transition fallback for `/homework`. The list page fetches the
 * child's groups, then every group's topics, tasks, and completions —
 * several sequential remote round-trips — so it needs an immediate loading
 * state rather than leaving the previous screen frozen with no feedback.
 *
 * The mascot shown here comes from a cookie (not a DB query) so this stays
 * instant — see `writeMascotImageCookie` in the wardrobe equip/unequip
 * actions — and matches whatever look the child last equipped in Wardrobe.
 */
export default async function Loading() {
  const mascotImageUrl = await readMascotImageCookie();
  return <FullScreenLoader label="Loading homework…" mascotImageUrl={mascotImageUrl} />;
}
