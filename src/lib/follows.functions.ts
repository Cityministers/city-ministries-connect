import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Target = z.object({
  targetType: z.enum(["church", "ministry", "need", "user"]),
  targetId: z.string().uuid(),
});

export const getFollowState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Target.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("follows")
      .select("id")
      .eq("user_id", context.userId)
      .eq("target_type", data.targetType)
      .eq("target_id", data.targetId)
      .maybeSingle();
    return { following: Boolean(row), self: data.targetType === "user" && data.targetId === context.userId };
  });

export const toggleFollow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Target.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("follows")
      .select("id")
      .eq("user_id", context.userId)
      .eq("target_type", data.targetType)
      .eq("target_id", data.targetId)
      .maybeSingle();
    if (row) {
      const { error } = await context.supabase.from("follows").delete().eq("id", row.id);
      if (error) throw new Error(error.message);
      return { following: false };
    }
    const { error } = await context.supabase.from("follows").insert({
      user_id: context.userId,
      target_type: data.targetType,
      target_id: data.targetId,
    });
    if (error) throw new Error(error.message);
    return { following: true };
  });

export type FollowItem = {
  targetType: "church" | "ministry" | "need" | "user";
  targetId: string;
  name: string;
  photo: string | null;
};

export const listMyFollows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FollowItem[]> => {
    const sb = context.supabase;
    const { data: rows } = await sb
      .from("follows")
      .select("target_type,target_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    const list = rows ?? [];
    const ids = (t: string) => list.filter((r) => r.target_type === t).map((r) => r.target_id);
    const names = new Map<string, { name: string; photo: string | null }>();
    const [ch, mi, ne, us] = await Promise.all([
      ids("church").length ? sb.from("churches").select("id,name,avatar_url").in("id", ids("church")) : null,
      ids("ministry").length ? sb.from("user_ministries").select("id,short_title").in("id", ids("ministry")) : null,
      ids("need").length ? sb.from("user_needs").select("id,short_title").in("id", ids("need")) : null,
      ids("user").length ? sb.from("profiles").select("id,display_name,avatar_url").in("id", ids("user")) : null,
    ]);
    ch?.data?.forEach((r) => names.set(r.id, { name: r.name, photo: r.avatar_url }));
    mi?.data?.forEach((r) => names.set(r.id, { name: r.short_title, photo: null }));
    ne?.data?.forEach((r) => names.set(r.id, { name: r.short_title, photo: null }));
    us?.data?.forEach((r) => names.set(r.id, { name: r.display_name ?? "Member", photo: r.avatar_url }));
    return list
      .filter((r) => names.has(r.target_id))
      .map((r) => ({
        targetType: r.target_type as FollowItem["targetType"],
        targetId: r.target_id,
        ...names.get(r.target_id)!,
      }));
  });
