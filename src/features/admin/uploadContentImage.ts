import { createClient } from "@/lib/supabase/client";

/** Storage bucket for admin-managed content imagery (see the content_images migration). */
const BUCKET = "content";

export type ContentImageFolder = "districts" | "locations";

/**
 * Uploads an image blob to the public `content` bucket and returns its public
 * URL. Runs in the browser as the signed-in admin — storage RLS restricts
 * writes to admins, public read serves the map. Each upload gets a unique
 * name, so old images are simply orphaned rather than overwritten.
 */
export async function uploadContentImage(
  file: Blob,
  folder: ContentImageFolder,
  ext: string
): Promise<string> {
  const supabase = createClient();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || `image/${ext}`,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
