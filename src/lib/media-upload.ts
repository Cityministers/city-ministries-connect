import { supabase } from "@/integrations/supabase/client";

export type MediaItem = { path: string; kind: "image" | "video" };
export type MediaPreview = { url: string; kind: "image" | "video"; file: File };

export const MAX_PHOTOS = 6;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/** Builds local previews for freshly picked files. */
export function toPreviews(files: File[]): MediaPreview[] {
  return files.map((file) => ({
    file,
    url: URL.createObjectURL(file),
    kind: file.type.startsWith("video/") ? "video" : "image",
  }));
}

/** Uploads picked photos and video to storage and returns their saved paths. */
export async function uploadMedia(
  items: MediaPreview[],
  prefix: string,
): Promise<MediaItem[]> {
  if (items.length === 0) return [];
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error("Please sign in again.");

  const out: MediaItem[] = [];
  for (const item of items) {
    const ext = item.file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${uid}/${prefix}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("ministry-avatars")
      .upload(path, item.file, { upsert: false, contentType: item.file.type });
    if (error) throw new Error(error.message);
    out.push({ path, kind: item.kind });
  }
  return out;
}
