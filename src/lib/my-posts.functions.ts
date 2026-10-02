import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MyPostDTO = {
  postType: "ministry" | "need";
  id: string;
  shortTitle: string;
  title: string;
  description: string;
  city: string;
  zip: string;
  photoUrl: string | null;
  updatedAt: string;
  status: string;
  metAt: string | null;
};

const ref = z.object({
  postType: z.enum(["ministry", "need"]),
  id: z.string().uuid(),
});

const editInput = ref.extend({
  shortTitle: z.string().trim().min(2).max(24),
  title: z.string().trim().max(100).optional().default(""),
  description: z.string().trim().min(10).max(400),
  city: z.string().trim().max(80).optional().default(""),
  zip: z.string().trim().max(10).optional().default(""),
  avatarPath: z.string().trim().max(300).optional(),
});

function tableFor(postType: "ministry" | "need") {
  return postType === "need" ? ("user_needs" as const) : ("user_ministries" as const);
}

export const listMyPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyPostDTO[]> => {
    const out: MyPostDTO[] = [];
    const paths: string[] = [];

    for (const postType of ["ministry", "need"] as const) {
      const { data } = await context.supabase
        .from(tableFor(postType))
        .select(postType === "need" ? "id, short_title, title, description, city, zip, avatar_url, updated_at, status, met_at" : "id, short_title, title, description, city, zip, avatar_url, updated_at, status")
        .eq("owner_id", context.userId)
        .order("updated_at", { ascending: false });
      for (const r of data ?? []) {
        if (r.avatar_url) paths.push(r.avatar_url);
        out.push({
          postType,
          id: r.id,
          shortTitle: r.short_title,
          title: r.title || r.short_title,
          description: r.description,
          city: r.city ?? "",
          zip: r.zip ?? "",
          photoUrl: r.avatar_url,
          updatedAt: r.updated_at,
          status: r.status,
          metAt: "met_at" in r ? (r.met_at as string | null) : null,
        });
      }
    }

    if (paths.length > 0) {
      const { data: signed } = await context.supabase.storage
        .from("ministry-avatars")
        .createSignedUrls(paths, 60 * 60 * 24 * 7);
      const byPath = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl]));
      for (const item of out) {
        item.photoUrl = item.photoUrl ? (byPath.get(item.photoUrl) ?? null) : null;
      }
    }

    return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });

export const updateMyPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => editInput.parse(data))
  .handler(async ({ data, context }) => {
    if (data.city.trim().length < 2 && data.zip.trim().length < 4) {
      throw new Error("Enter the city or ZIP so your pin lands in the right place.");
    }
    const patch = {
      short_title: data.shortTitle,
      title: data.title || data.shortTitle,
      description: data.description,
      city: data.city,
      zip: data.zip,
      ...(data.avatarPath ? { avatar_url: data.avatarPath } : {}),
    };
    const { error } = await context.supabase
      .from(tableFor(data.postType))
      .update(patch)
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Bumps the post so it shows as recent again on the map and list. */
export const repostMyPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ref.parse(data))
  .handler(async ({ data, context }) => {
    if (data.postType === "need") {
      const { data: need } = await context.supabase.from("user_needs").select("status").eq("id", data.id).eq("owner_id", context.userId).maybeSingle();
      if (need?.status !== "active") throw new Error("Reopen this need before reposting it.");
    }
    const { error } = await context.supabase
      .from(tableFor(data.postType))
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMyPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ref.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from(tableFor(data.postType))
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("favorites")
      .delete()
      .eq("post_type", data.postType)
      .eq("post_id", data.id);
    await supabaseAdmin
      .from("post_reactions")
      .delete()
      .eq("post_type", data.postType)
      .eq("post_id", data.id);
    await supabaseAdmin
      .from("post_comments")
      .delete()
      .eq("post_type", data.postType)
      .eq("post_id", data.id);
    return { ok: true };
  });
