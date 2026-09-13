/** Shared helpers for picking, shrinking and uploading a profile photo. */

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_LABEL = "10 MB";

/** Returns a friendly message when the picked file can't be used, else null. */
export function checkImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "That file isn't a photo. Please choose a JPG, PNG or HEIC image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `That photo is too large. Please pick one under ${MAX_IMAGE_LABEL}.`;
  }
  return null;
}

/**
 * Shrinks a large image in the browser so it uploads quickly on mobile data.
 * Falls back to the original file if the browser can't decode it (e.g. HEIC).
 */
export async function shrinkImage(file: File, maxSide = 1600): Promise<File> {
  if (typeof document === "undefined") return file;
  if (file.size < 600 * 1024) return file;
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85),
    );
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Turns a raw storage/network failure into something a person can act on. */
export function friendlyUploadError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const text = raw.toLowerCase();
  if (text.includes("exceeded the maximum allowed size") || text.includes("payload too large")) {
    return `That photo is too large. Please pick one under ${MAX_IMAGE_LABEL}.`;
  }
  if (text.includes("mime") || text.includes("not supported")) {
    return "That file type isn't supported. Please use a JPG or PNG photo.";
  }
  if (text.includes("network") || text.includes("failed to fetch") || text.includes("timeout")) {
    return "Your photo couldn't upload — check your connection and try again.";
  }
  if (text.includes("sign in")) return "Please sign in again, then try once more.";
  return raw || "Your photo couldn't upload. Please try again.";
}
