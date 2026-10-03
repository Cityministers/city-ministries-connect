import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const bucket = "neighborhood-videos";
const select = "id,owner_id,kind,title,description,city,zip,lat,lng,video_path,thumbnail_path,duration_seconds,status,created_at" as const;
export type NeighborhoodVideo = {
  id: string; ownerId: string; kind: "tour" | "concern"; title: string; description: string;
  city: string; zip: string; lat: number; lng: number; duration: number; status: string;
  createdAt: string; author: string; videoUrl: string | null; thumbnailUrl: string | null;
};
type VideoRow = Database["public"]["Tables"]["neighborhood_videos"]["Row"];

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
}

async function decorate(rows: VideoRow[]): Promise<NeighborhoodVideo[]> {
  if (!rows.length) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ids = [...new Set(rows.map((r) => r.owner_id))];
  const { data: profiles } = await supabaseAdmin.from("profiles").select("id,display_name").in("id", ids);
  const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name || "Member"]));
  const paths = [...new Set(rows.flatMap((r) => [r.video_path, r.thumbnail_path].filter((p): p is string => !!p)))];
  const { data: signed, error } = await supabaseAdmin.storage.from(bucket).createSignedUrls(paths, 3600);
  if (error) throw error;
  const urls = new Map((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl]));
  return rows.map((r) => ({
    id: r.id, ownerId: r.owner_id, kind: r.kind as "tour" | "concern", title: r.title,
    description: r.description, city: r.city, zip: r.zip, lat: r.lat, lng: r.lng,
    duration: r.duration_seconds, status: r.status, createdAt: r.created_at,
    author: names.get(r.owner_id) ?? "Member", videoUrl: urls.get(r.video_path) ?? null,
    thumbnailUrl: r.thumbnail_path ? urls.get(r.thumbnail_path) ?? null : null,
  }));
}

export const listNeighborhoodVideos = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().from("neighborhood_videos").select(select).eq("status", "approved").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return decorate(data ?? []);
});

export const listMyNeighborhoodVideos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("neighborhood_videos").select(select).eq("owner_id", context.userId).neq("status", "approved").order("created_at", { ascending: false }).limit(30);
    if (error) throw error;
    return decorate(data ?? []);
  });

const submitSchema = z.object({
  kind: z.enum(["tour", "concern"]), title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1200), city: z.string().trim().max(120),
  zip: z.string().trim().max(20), location: z.string().trim().min(2).max(120),
  duration: z.number().int().min(60).max(180),
  videoPath: z.string().max(300), thumbnailPath: z.string().max(300).nullable(),
});
export const submitNeighborhoodVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator((input) => submitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const prefix = `${context.userId}/`;
    if (!data.videoPath.startsWith(prefix) || (data.thumbnailPath && !data.thumbnailPath.startsWith(prefix))) throw new Error("Invalid upload path.");
    if (!/\.(mp4|mov|webm|m4v)$/i.test(data.videoPath) || (data.thumbnailPath && !/\.(jpg|jpeg|png|webp)$/i.test(data.thumbnailPath))) throw new Error("Invalid file type.");
    const { geocodeQuery } = await import("@/lib/geocode.server");
    const place = await geocodeQuery(data.location);
    if (!place) throw new Error("Please enter a city or ZIP we can find on the map.");
    const { data: files, error: fileError } = await context.supabase.storage.from(bucket).list(context.userId, { limit: 100, search: data.videoPath.slice(prefix.length) });
    if (fileError || !files?.some((f) => `${prefix}${f.name}` === data.videoPath && Number(f.metadata?.size ?? 0) <= 50 * 1024 * 1024)) throw new Error("Video upload wasn't found or is too large.");
    const { error } = await context.supabase.from("neighborhood_videos").insert({
      owner_id: context.userId, kind: data.kind, title: data.title, description: data.description,
      city: data.city, zip: data.zip, lat: place.lat, lng: place.lng, duration_seconds: data.duration,
      video_path: data.videoPath, thumbnail_path: data.thumbnailPath,
    });
    if (error) throw error;
    return { ok: true };
  });

export const removeMyNeighborhoodVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase.from("neighborhood_videos").select("video_path,thumbnail_path").eq("id", data.id).eq("owner_id", context.userId).maybeSingle();
    if (!row) throw new Error("Video not found.");
    const { error } = await context.supabase.from("neighborhood_videos").delete().eq("id", data.id).eq("owner_id", context.userId);
    if (error) throw error;
    await context.supabase.storage.from(bucket).remove([row.video_path, ...(row.thumbnail_path ? [row.thumbnail_path] : [])]);
    return { ok: true };
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.from("user_roles").select("id").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Only admins can review videos.");
}
export const listPendingNeighborhoodVideos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("neighborhood_videos").select(select).eq("status", "pending").order("created_at", { ascending: true }).limit(100);
    if (error) throw error;
    return decorate(data ?? []);
  });
export const moderateNeighborhoodVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid(), action: z.enum(["approve", "decline", "hide", "delete"]) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row } = await context.supabase.from("neighborhood_videos").select("owner_id,title,video_path,thumbnail_path,status").eq("id", data.id).maybeSingle();
    if (!row) throw new Error("Video not found.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "decline" || data.action === "delete") {
      const { error } = await supabaseAdmin.from("neighborhood_videos").delete().eq("id", data.id);
      if (error) throw error;
      await supabaseAdmin.storage.from(bucket).remove([row.video_path, ...(row.thumbnail_path ? [row.thumbnail_path] : [])]);
    } else {
      const { error } = await supabaseAdmin.from("neighborhood_videos").update({ status: data.action === "approve" ? "approved" : "hidden" }).eq("id", data.id);
      if (error) throw error;
    }
    if (data.action === "approve" || data.action === "decline") {
      await supabaseAdmin.from("notifications").insert({
        user_id: row.owner_id, kind: `neighborhood_video_${data.action}d`,
        title: data.action === "approve" ? "Your neighborhood video is live" : "Your neighborhood video wasn't approved",
        body: row.title, link: "/map?mode=video",
      });
    }
    return { ok: true };
  });
