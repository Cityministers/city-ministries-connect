import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const postRef = z.object({
  postType: z.enum(["ministry", "need", "prayer"]),
  postId: z.string().uuid(),
});

export type SavedPostDTO = {
  postType: "ministry" | "need" | "prayer" | "room";
  roomSlug?: string | undefined;
  postId: string;
  shortTitle: string;
  title: string;
  description: string;
  city: string;
  zip: string;
  photoUrl: string | null;
  savedAt: string;
};

/** Everything the signed-in member has saved, newest first. */
export const listMyFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SavedPostDTO[]> => {
    const { data: favsRaw } = await context.supabase
      .from("favorites")
      .select("post_type, post_id, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    const favs = favsRaw ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: roomSaves } = await (context.supabase as any)
      .from("room_post_saves")
      .select("post_id, created_at")
      .eq("user_id", context.userId)
      .limit(200);
    const rs = (roomSaves ?? []) as { post_id: string; created_at: string }[];
    if ((!favs || favs.length === 0) && rs.length === 0) return [];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const out: SavedPostDTO[] = [];
    const paths: string[] = [];

    for (const table of ["user_ministries", "user_needs"] as const) {
      const kind = table === "user_needs" ? "need" : "ministry";
      const ids = favs.filter((f) => f.post_type === kind).map((f) => f.post_id);
      if (ids.length === 0) continue;
      const { data } = await supabaseAdmin
        .from(table)
        .select("id, short_title, title, description, city, zip, avatar_url")
        .in("id", ids);
      for (const row of data ?? []) {
        const savedAt =
          favs.find((f) => f.post_id === row.id)?.created_at ?? new Date().toISOString();
        if (row.avatar_url) paths.push(row.avatar_url);
        out.push({
          postType: kind,
          postId: row.id,
          shortTitle: row.short_title,
          title: row.title || row.short_title,
          description: row.description,
          city: row.city ?? "",
          zip: row.zip ?? "",
          photoUrl: row.avatar_url,
          savedAt,
        });
      }
    }

    const prayerIds = favs.filter((f) => f.post_type === "prayer").map((f) => f.post_id);
    if (prayerIds.length > 0) {
      const { data: prayerRows } = await supabaseAdmin
        .from("prayers")
        .select("id, short_title, body, city, zip")
        .in("id", prayerIds);
      for (const row of prayerRows ?? []) {
        out.push({
          postType: "prayer",
          postId: row.id,
          shortTitle: row.short_title,
          title: row.short_title,
          description: row.body,
          city: row.city ?? "",
          zip: row.zip ?? "",
          photoUrl: null,
          savedAt:
            favs.find((f) => f.post_id === row.id)?.created_at ?? new Date().toISOString(),
        });
      }
    }

    if (rs.length > 0) {
      const { data: rows } = await supabaseAdmin
        .from("room_posts")
        .select("id, title, body, image_url, status, rooms(slug, title)")
        .in("id", rs.map((r) => r.post_id));
      for (const row of rows ?? []) {
        if (row.status !== "approved") continue;
        const room = row.rooms as unknown as { slug: string; title: string } | null;
        const t = row.title || row.body.slice(0, 80);
        out.push({
          postType: "room",
          roomSlug: room?.slug,
          postId: row.id,
          shortTitle: t,
          title: t,
          description: row.body,
          city: room?.title ?? "",
          zip: "",
          photoUrl: row.image_url,
          savedAt: rs.find((r) => r.post_id === row.id)?.created_at ?? new Date().toISOString(),
        });
      }
    }

    if (paths.length > 0) {
      const { data: signed } = await supabaseAdmin.storage
        .from("ministry-avatars")
        .createSignedUrls(paths, 60 * 60 * 24 * 7);
      const byPath = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl]));
      for (const item of out) {
        if (item.postType === "room") continue;
        item.photoUrl = item.photoUrl ? (byPath.get(item.photoUrl) ?? null) : null;
      }
    }

    return out.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  });

/** Which of the given posts the member has saved or liked. */
export const getMyPostState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => postRef.parse(data))
  .handler(async ({ data, context }) => {
    const [{ data: fav }, { data: like }, { count }] = await Promise.all([
      context.supabase
        .from("favorites")
        .select("id")
        .eq("user_id", context.userId)
        .eq("post_type", data.postType)
        .eq("post_id", data.postId)
        .maybeSingle(),
      context.supabase
        .from("post_reactions")
        .select("id")
        .eq("user_id", context.userId)
        .eq("post_type", data.postType)
        .eq("post_id", data.postId)
        .maybeSingle(),
      context.supabase
        .from("post_reactions")
        .select("id", { count: "exact", head: true })
        .eq("post_type", data.postType)
        .eq("post_id", data.postId),
    ]);
    return { favorited: Boolean(fav), liked: Boolean(like), likeCount: count ?? 0 };
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => postRef.parse(data))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("favorites")
      .select("id")
      .eq("user_id", context.userId)
      .eq("post_type", data.postType)
      .eq("post_id", data.postId)
      .maybeSingle();

    if (existing) {
      await context.supabase.from("favorites").delete().eq("id", existing.id);
      return { favorited: false };
    }

    const { error } = await context.supabase.from("favorites").insert({
      user_id: context.userId,
      post_type: data.postType,
      post_id: data.postId,
    });
    if (error) throw new Error(error.message);
    return { favorited: true };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => postRef.parse(data))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("post_reactions")
      .select("id")
      .eq("user_id", context.userId)
      .eq("post_type", data.postType)
      .eq("post_id", data.postId)
      .maybeSingle();

    if (existing) {
      await context.supabase.from("post_reactions").delete().eq("id", existing.id);
      return { liked: false };
    }

    const { error } = await context.supabase.from("post_reactions").insert({
      user_id: context.userId,
      post_type: data.postType,
      post_id: data.postId,
      kind: "like",
    });
    if (error) throw new Error(error.message);

    const { getPostOwner, notifyUser, displayNameOf } = await import("./social.server");
    const owner = await getPostOwner(data.postType, data.postId);
    if (owner) {
      await notifyUser({
        userId: owner.ownerId,
        actorId: context.userId,
        kind: "like",
        title: `${await displayNameOf(context.userId)} liked "${owner.shortTitle}"`,
        link: "/profile?tab=posts",
      });
    }
    return { liked: true };
  });

export type CommentDTO = {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export const listComments = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => postRef.parse(data))
  .handler(async ({ data }): Promise<CommentDTO[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("post_comments")
      .select("id, body, user_id, created_at")
      .eq("post_type", data.postType)
      .eq("post_id", data.postId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (!rows || rows.length === 0) return [];

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name")
      .in("id", [...new Set(rows.map((r) => r.user_id))]);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

    return rows.map((r) => ({
      id: r.id,
      body: r.body,
      authorName: nameById.get(r.user_id) || "A neighbor",
      createdAt: r.created_at,
    }));
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    postRef.extend({ body: z.string().trim().min(1).max(500) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("post_comments").insert({
      user_id: context.userId,
      post_type: data.postType,
      post_id: data.postId,
      body: data.body,
    });
    if (error) throw new Error(error.message);

    const { getPostOwner, notifyUser, displayNameOf } = await import("./social.server");
    const owner = await getPostOwner(data.postType, data.postId);
    if (owner) {
      await notifyUser({
        userId: owner.ownerId,
        actorId: context.userId,
        kind: "comment",
        title: `${await displayNameOf(context.userId)} commented on "${owner.shortTitle}"`,
        body: data.body.slice(0, 140),
        link: "/profile?tab=posts",
      });
    }
    return { ok: true };
  });
