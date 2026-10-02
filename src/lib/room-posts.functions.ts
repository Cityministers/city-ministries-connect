import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function isAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  if (!(await isAdmin(context))) throw new Error("Only admins can do this.");
}

/** Signed links for room media. Approved posts are visible to all; others only to author/admin (checked via RLS read first). */
export const getRoomMediaUrls = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ paths: z.array(z.string().max(300)).max(200) }).parse(d))
  .handler(async ({ data }) => {
    if (!data.paths.length) return {} as Record<string, string>;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("room_posts")
      .select("media_path")
      .eq("status", "approved")
      .in("media_path", data.paths);
    const allowed = (rows ?? []).map((r) => r.media_path!).filter(Boolean);
    if (!allowed.length) return {} as Record<string, string>;
    const { data: signed } = await supabaseAdmin.storage.from("room-media").createSignedUrls(allowed, 3600);
    const out: Record<string, string> = {};
    for (const s of signed ?? []) if (s.path && s.signedUrl) out[s.path] = s.signedUrl;
    return out;
  });

/** Signed links for the caller's own or (for admins) any pending media. */
export const getPrivateRoomMediaUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ paths: z.array(z.string().max(300)).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!data.paths.length) return {} as Record<string, string>;
    // RLS limits these rows to the author's own posts or all posts for admins.
    const { data: rows } = await context.supabase.from("room_posts").select("media_path").in("media_path", data.paths);
    const allowed = (rows ?? []).map((r: { media_path: string | null }) => r.media_path!).filter(Boolean);
    if (!allowed.length) return {} as Record<string, string>;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage.from("room-media").createSignedUrls(allowed, 3600);
    const out: Record<string, string> = {};
    for (const s of signed ?? []) if (s.path && s.signedUrl) out[s.path] = s.signedUrl;
    return out;
  });

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ admin: await isAdmin(context) }));

export const moderateRoomPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), action: z.enum(["approve", "hide", "decline", "delete"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: post } = await supabaseAdmin
      .from("room_posts")
      .select("id, author_id, body, media_path, room_id, status, rooms(slug, title)")
      .eq("id", data.id)
      .maybeSingle();
    if (!post) throw new Error("Post not found.");
    const room = (post as any).rooms as { slug: string; title: string } | null;
    const snippet = post.body.slice(0, 80);

    if (data.action === "delete" || data.action === "decline") {
      if (post.media_path) await supabaseAdmin.storage.from("room-media").remove([post.media_path]);
      await supabaseAdmin.from("room_posts").delete().eq("id", post.id);
    } else {
      await supabaseAdmin
        .from("room_posts")
        .update({ status: data.action === "approve" ? "approved" : "hidden" })
        .eq("id", post.id);
    }

    if (post.author_id !== context.userId && (data.action === "approve" || data.action === "decline")) {
      await supabaseAdmin.from("notifications").insert({
        user_id: post.author_id,
        kind: data.action === "approve" ? "room_post_approved" : "room_post_declined",
        title: data.action === "approve" ? "Your room post is live" : "Your room post wasn't approved",
        body: `${room?.title ?? "Room"}: “${snippet}”`,
        link: room ? `/rooms/${room.slug}` : "/explore",
      });
    }
    return { ok: true };
  });

export type PendingRoomPost = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
  roomSlug: string;
  roomTitle: string;
  mediaType: string | null;
  mediaUrl: string | null;
};

export const listPendingRoomPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PendingRoomPost[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: posts } = await supabaseAdmin
      .from("room_posts")
      .select("id, body, created_at, author_id, media_path, media_type, rooms(slug, title)")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(200);
    const list = posts ?? [];
    const ids = [...new Set(list.map((p) => p.author_id))];
    const { data: profs } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, display_name").in("id", ids)
      : { data: [] as { id: string; display_name: string | null }[] };
    const names = new Map((profs ?? []).map((p) => [p.id, p.display_name ?? "Member"]));
    const paths = list.map((p) => p.media_path).filter(Boolean) as string[];
    const urls: Record<string, string> = {};
    if (paths.length) {
      const { data: signed } = await supabaseAdmin.storage.from("room-media").createSignedUrls(paths, 3600);
      for (const s of signed ?? []) if (s.path && s.signedUrl) urls[s.path] = s.signedUrl;
    }
    return list.map((p) => {
      const room = (p as any).rooms as { slug: string; title: string } | null;
      return {
        id: p.id,
        body: p.body,
        createdAt: p.created_at,
        authorName: names.get(p.author_id) ?? "Member",
        roomSlug: room?.slug ?? "",
        roomTitle: room?.title ?? "",
        mediaType: p.media_type,
        mediaUrl: p.media_path ? urls[p.media_path] ?? null : null,
      };
    });
  });
