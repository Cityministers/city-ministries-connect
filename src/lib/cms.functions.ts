import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Only the site owner can use the CMS.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

// ---------- Users ----------
export type CmsUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  suspended: boolean;
  roles: string[];
  isDemo: boolean;
};

export const cmsListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string }) => z.object({ q: z.string().max(100).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }): Promise<CmsUser[]> => {
    const admin = await assertAdmin(context);
    const { data: authRows, error } = await admin.rpc("cms_user_emails");
    if (error) throw new Error(error.message);
    const list = { users: (authRows ?? []) as { id: string; email: string; created_at: string }[] };
    const ids = list.users.map((u: any) => u.id);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      admin.from("profiles").select("id, display_name, suspended_at, is_demo").in("id", ids),
      admin.from("user_roles").select("user_id, role").in("user_id", ids),
    ]);
    const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const q = (data.q ?? "").toLowerCase().trim();
    return list.users
      .map((u: any) => {
        const p: any = pMap.get(u.id) ?? {};
        return {
          id: u.id,
          email: u.email ?? "",
          displayName: p.display_name ?? "",
          createdAt: u.created_at,
          suspended: !!p.suspended_at,
          isDemo: !!p.is_demo,
          roles: (roles ?? []).filter((r: any) => r.user_id === u.id).map((r: any) => r.role),
        };
      })
      .filter((u: CmsUser) => !q || u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q))
      .sort((a: CmsUser, b: CmsUser) => b.createdAt.localeCompare(a.createdAt));
  });

export const cmsSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), role: z.enum(["admin", "moderator"]), on: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    if (data.userId === context.userId && data.role === "admin" && !data.on)
      throw new Error("You can't remove your own admin access.");
    if (data.on) {
      const { error } = await admin.from("user_roles").upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const cmsSuspendUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), suspended: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("You can't suspend yourself.");
    const { error } = await admin
      .from("profiles")
      .update({ suspended_at: data.suspended ? new Date().toISOString() : null })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cmsDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("You can't delete your own account here.");
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Posts ----------
const POST_TABLES = {
  ministry: { table: "user_ministries", title: "short_title", body: "description", author: "owner_id" },
  need: { table: "user_needs", title: "short_title", body: "description", author: "owner_id" },
  prayer: { table: "prayers", title: "short_title", body: "body", author: "owner_id" },
  video: { table: "neighborhood_videos", title: "title", body: "description", author: "owner_id" },
  room: { table: "room_posts", title: "title", body: "body", author: "author_id" },
} as const;
const postType = z.enum(["ministry", "need", "prayer", "video", "room"]);
export type CmsPostType = z.infer<typeof postType>;

export type CmsPost = {
  id: string;
  type: CmsPostType;
  title: string;
  body: string;
  status: string;
  author: string;
  createdAt: string;
};

export const cmsListPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ type: postType, q: z.string().max(100).optional() }).parse(d))
  .handler(async ({ data, context }): Promise<CmsPost[]> => {
    const admin = await assertAdmin(context);
    const cfg = POST_TABLES[data.type];
    const { data: rows, error } = await admin
      .from(cfg.table)
      .select(`id, ${cfg.title}, ${cfg.body}, status, ${cfg.author}, created_at`)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const authorIds = [...new Set((rows ?? []).map((r: any) => r[cfg.author]))];
    const { data: profiles } = await admin.from("profiles").select("id, display_name").in("id", authorIds);
    const names = new Map((profiles ?? []).map((p: any) => [p.id, p.display_name ?? ""]));
    const q = (data.q ?? "").toLowerCase();
    return (rows ?? [])
      .map((r: any) => ({
        id: r.id,
        type: data.type,
        title: r[cfg.title] ?? "",
        body: r[cfg.body] ?? "",
        status: r.status,
        author: (names.get(r[cfg.author]) as string) || "Member",
        createdAt: r.created_at,
      }))
      .filter((p: CmsPost) => !q || `${p.title} ${p.body} ${p.author}`.toLowerCase().includes(q));
  });

export const cmsUpdatePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        type: postType,
        id: z.string().uuid(),
        title: z.string().max(200).optional(),
        body: z.string().max(5000).optional(),
        status: z.string().max(30).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const cfg = POST_TABLES[data.type];
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch[cfg.title] = data.title;
    if (data.body !== undefined) patch[cfg.body] = data.body;
    if (data.status !== undefined) patch["status"] = data.status;
    const { error } = await admin.from(cfg.table).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cmsDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ type: postType, id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const { error } = await admin.from(POST_TABLES[data.type].table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Rooms ----------
export type CmsRoom = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  category: string;
  pinned: boolean;
  inDefaultFeed: boolean;
};

export const cmsListRooms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CmsRoom[]> => {
    const admin = await assertAdmin(context);
    const { data, error } = await admin
      .from("rooms")
      .select("id, slug, title, description, status, category, pinned, in_default_feed, sort")
      .order("pinned", { ascending: false })
      .order("sort");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      status: r.status,
      category: r.category,
      pinned: r.pinned,
      inDefaultFeed: r.in_default_feed,
    }));
  });

export const cmsUpdateRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(120).optional(),
        description: z.string().max(1000).optional(),
        status: z.enum(["approved", "pending", "declined"]).optional(),
        pinned: z.boolean().optional(),
        inDefaultFeed: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch["title"] = data.title;
    if (data.description !== undefined) patch["description"] = data.description;
    if (data.status !== undefined) patch["status"] = data.status;
    if (data.pinned !== undefined) patch["pinned"] = data.pinned;
    if (data.inDefaultFeed !== undefined) patch["in_default_feed"] = data.inDefaultFeed;
    const { error } = await admin.from("rooms").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cmsDeleteRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const { error } = await admin.from("rooms").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Churches (edit) ----------
export const cmsUpdateChurch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(120),
        description: z.string().max(2000),
        address: z.string().max(200),
        city: z.string().max(100),
        zip: z.string().max(20),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const { id, ...rest } = data;
    const { error } = await admin.from("churches").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Site text ----------
export const cmsSaveSiteText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ key: z.string().regex(/^[a-z0-9_.-]{1,60}$/), value: z.string().max(10000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_content")
      .upsert({ key: data.key, value: data.value, updated_by: context.userId }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public read — no sign-in needed.
export const getSiteText = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data } = await sb.from("site_content" as any).select("key, value");
  const out: Record<string, string> = {};
  for (const r of (data ?? []) as any[]) if (r.value?.trim()) out[r.key] = r.value;
  return out;
});
