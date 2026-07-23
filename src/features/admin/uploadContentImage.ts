import { createClient } from "@/lib/supabase/client";

/** Storage bucket for admin-managed content imagery (see the content_images migration). */
const BUCKET = "content";

export type ContentImageFolder = "districts" | "locations" | "wardrobe" | "homework" | "tasks";

/**
 * Uploads an image blob to the public `content` bucket and returns its public
 * URL. Public read serves the map. Storage RLS restricts writes to admins for
 * every folder except `homework/`, which any teacher may also write to (for
 * topic note images — see `20260720000012_homework_topic_notes.sql`). Each
 * upload gets a unique name, so old images are simply orphaned rather than
 * overwritten.
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
