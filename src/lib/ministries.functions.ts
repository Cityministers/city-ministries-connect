import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type UserMinistryDTO = {
  id: string;
  ownerId: string;
  shortTitle: string;
  title: string;
  description: string;
  city: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
  /** Pre-made ministry id when the post was started from our list; its icon is used on the map. */
  iconId: string | null;
  gallery: { url: string; kind: "image" | "video" }[];
  posterName: string;
  posterPhotoUrl: string | null;
  posterBio: string;
  likes: number;
  comments: number;
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listUserMinistries = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserMinistryDTO[]> => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("user_ministries")
      .select(
        "id, owner_id, short_title, title, description, city, zip, lat, lng, avatar_url, icon_id, gallery",
      )
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error || !data) return [];

    // Posts are placed on the map from their city/ZIP the first time they're listed.
    const placed = new Map<string, { lat: number; lng: number }>();
    const unplaced = data.filter((r) => r.lat == null || r.lng == null);
    if (unplaced.length > 0) {
      const { geocodePlaces, placeKey } = await import("./geocode.server");
      const found = await geocodePlaces(
        unplaced.map((r) => ({ city: r.city ?? "", zip: r.zip ?? "" })),
      );
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      for (const r of unplaced) {
        const point = found.get(placeKey(r.city ?? "", r.zip ?? ""));
        if (!point) continue;
        placed.set(r.id, point);
        await supabaseAdmin
          .from("user_ministries")
          .update({ lat: point.lat, lng: point.lng })
          .eq("id", r.id);
      }
    }

    const ownerIds = [...new Set(data.map((r) => r.owner_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, bio")
      .in("id", ownerIds);
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    // Public like and comment counts, so cards show real engagement.
    const postIds = data.map((r) => r.id);
    const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
      supabase.from("post_reactions").select("post_id").eq("post_type", "ministry").in("post_id", postIds),
      supabase.from("post_comments").select("post_id").eq("post_type", "ministry").in("post_id", postIds),
    ]);
    const tally = (rows: { post_id: string }[] | null) => {
      const map = new Map<string, number>();
      for (const r of rows ?? []) map.set(r.post_id, (map.get(r.post_id) ?? 0) + 1);
      return map;
    };
    const likeCount = tally(likeRows);
    const commentCount = tally(commentRows);

    const galleryByRow = new Map<string, { path: string; kind: "image" | "video" }[]>();
    for (const r of data) {
      const raw = Array.isArray(r.gallery) ? r.gallery : [];
      galleryByRow.set(
        r.id,
        raw
          .map((item) => item as { path?: string; kind?: string })
          .filter((item): item is { path: string; kind: string } => typeof item?.path === "string")
          .map((item) => ({ path: item.path, kind: item.kind === "video" ? "video" : "image" as const })),
      );
    }

    const paths = [
      ...data.map((r) => r.avatar_url).filter((p): p is string => Boolean(p)),
      ...[...profileById.values()].map((p) => p.avatar_url).filter((p): p is string => Boolean(p)),
      ...[...galleryByRow.values()].flat().map((g) => g.path),
    ];
    const urlByPath = new Map<string, string>();
    if (paths.length > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed } = await supabaseAdmin.storage
        .from("ministry-avatars")
        .createSignedUrls(paths, 60 * 60 * 24 * 7);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
      }
    }

    return data.map((r) => ({
      id: r.id,
      ownerId: r.owner_id,
      shortTitle: r.short_title,
      title: r.title || r.short_title,
      description: r.description,
      city: r.city,
      zip: r.zip ?? "",
      photoUrl: r.avatar_url ? (urlByPath.get(r.avatar_url) ?? null) : null,
      iconId: r.icon_id,
      gallery: (galleryByRow.get(r.id) ?? [])
        .map((g) => ({ url: urlByPath.get(g.path) ?? "", kind: g.kind }))
        .filter((g) => g.url.length > 0),
      posterName: profileById.get(r.owner_id)?.display_name || "A neighbor",
      posterPhotoUrl: (() => {
        const p = profileById.get(r.owner_id)?.avatar_url;
        return p ? (urlByPath.get(p) ?? null) : null;
      })(),
      posterBio: profileById.get(r.owner_id)?.bio ?? "",
      likes: likeCount.get(r.id) ?? 0,
      comments: commentCount.get(r.id) ?? 0,
    }));
  },
);

const createInput = z.object({
  shortTitle: z.string().trim().min(2).max(24),
  title: z.string().trim().max(100).optional().default(""),
  description: z.string().trim().min(10).max(400),
  city: z.string().trim().min(2).max(80),
  zip: z.string().trim().max(10).optional().default(""),
  avatarPath: z.string().trim().max(300).optional().default(""),
  iconId: z.string().trim().max(80).optional().default(""),
  gallery: z
    .array(
      z.object({
        path: z.string().trim().min(1).max(300),
        kind: z.enum(["image", "video"]),
      }),
    )
    .max(8)
    .optional()
    .default([]),
});

export const createUserMinistry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("user_ministries")
      .insert({
        owner_id: context.userId,
        short_title: data.shortTitle,
        title: data.title || data.shortTitle,
        description: data.description,
        city: data.city,
        zip: data.zip,
        avatar_url: data.avatarPath || null,
        icon_id: data.iconId || null,
        gallery: data.gallery,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Give the poster a record of what they posted and when.
    const place = [data.city, data.zip].filter(Boolean).join(" ").trim();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("notifications").insert({
      user_id: context.userId,
      kind: "post_live",
      title: "Your ministry is live",
      body: `${data.shortTitle}${place ? ` — ${place}` : ""} · posted ${new Date().toLocaleString(
        "en-US",
        { dateStyle: "medium", timeStyle: "short" },
      )}`,
      link: `/map?place=${encodeURIComponent(place)}&new=${row.id}`,
    });

    return { id: row.id };
  });
