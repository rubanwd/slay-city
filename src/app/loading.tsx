import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { readMascotImageCookie } from "@/features/wardrobe/loadMascot";

/**
 * App-wide route transition fallback. Next.js shows this instantly when
 * navigating between pages while the destination Server Component fetches its
 * data (auth + remote Supabase queries), so tab switches feel immediate instead
 * of hanging on the previous screen.
 *
 * The mascot comes from a cookie (not a DB query) so this stays instant while
 * still matching whatever look the player last equipped in Wardrobe.
 */
export default async function Loading() {
  const mascotImageUrl = await readMascotImageCookie();
  return <FullScreenLoader mascotImageUrl={mascotImageUrl} />;
}
