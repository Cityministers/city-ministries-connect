import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type UserNeedDTO = {
  id: string;
  ownerId: string;
  shortTitle: string;
  title: string;
  description: string;
  city: string;
  zip: string;
  photoUrl: string | null;
  gallery: { url: string; kind: "image" | "video" }[];
  category: string | null;
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

export const listUserNeeds = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserNeedDTO[]> => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("user_needs")
      .select(
        "id, owner_id, short_title, title, description, city, zip, avatar_url, gallery, category",
      )
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error || !data) return [];

    const ownerIds = [...new Set(data.map((r) => r.owner_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, bio")
      .in("id", ownerIds);
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    const postIds = data.map((r) => r.id);
    const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
      supabase.from("post_reactions").select("post_id").eq("post_type", "need").in("post_id", postIds),
      supabase.from("post_comments").select("post_id").eq("post_type", "need").in("post_id", postIds),
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
      gallery: (galleryByRow.get(r.id) ?? [])
        .map((g) => ({ url: urlByPath.get(g.path) ?? "", kind: g.kind }))
        .filter((g) => g.url.length > 0),
      category: r.category ?? null,
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
  title: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().min(10).max(400),
  city: z.string().trim().max(80).optional().default(""),
  zip: z.string().trim().max(10).optional().default(""),
  avatarPath: z.string().trim().max(300).optional().default(""),
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
  category: z.string().trim().max(60).optional().default(""),
});

export const createUserNeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data, context }) => {
    if (data.city.length < 2 && data.zip.length < 4) {
      throw new Error("Enter the city or ZIP where you need help.");
    }

    const { data: userData } = await context.supabase.auth.getUser();
    if (!userData.user?.email_confirmed_at) {
      throw new Error("Please confirm your email before posting a need.");
    }

    const { data: row, error } = await context.supabase
      .from("user_needs")
      .insert({
        owner_id: context.userId,
        short_title: data.shortTitle,
        title: data.title || data.shortTitle,
        description: data.description,
        city: data.city,
        zip: data.zip,
        avatar_url: data.avatarPath || null,
        gallery: data.gallery,
        category: data.category || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Let neighbors in the same city or ZIP know about the new need.
    const { neighborsOf, notifyUser } = await import("./social.server");
    const neighbors = await neighborsOf(data.city, data.zip);
    for (const uid of neighbors) {
      await notifyUser({
        userId: uid,
        actorId: context.userId,
        kind: "need",
        title: `New need nearby: ${data.shortTitle}`,
        body: `${data.city || data.zip} — ${data.description.slice(0, 120)}`,
        link: "/needs",
      });
    }

    return { id: row.id };
  });
