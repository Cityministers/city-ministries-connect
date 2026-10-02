import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const needId = z.object({ needId: z.string().uuid() });

export type NeedHelper = {
  conversationId: string;
  memberId: string;
  name: string;
  avatarUrl: string | null;
};

export const listNeedHelpers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => needId.parse(input))
  .handler(async ({ data, context }): Promise<NeedHelper[]> => {
    const { data: need } = await context.supabase.from("user_needs")
      .select("id").eq("id", data.needId).eq("owner_id", context.userId).maybeSingle();
    if (!need) throw new Error("Need not found.");

    const { data: conversations, error } = await context.supabase.from("conversations")
      .select("id").eq("post_type", "need").eq("post_id", data.needId);
    if (error) throw new Error(error.message);
    const ids = (conversations ?? []).map((c) => c.id);
    if (!ids.length) return [];
    const { data: participants } = await context.supabase.from("conversation_participants")
      .select("conversation_id, user_id").in("conversation_id", ids).neq("user_id", context.userId);
    const unique = new Map<string, string>();
    for (const p of participants ?? []) if (!unique.has(p.user_id)) unique.set(p.user_id, p.conversation_id);
    if (!unique.size) return [];
    const { data: profiles } = await context.supabase.from("profiles")
      .select("id, display_name, avatar_url").in("id", [...unique.keys()]);
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    const paths = [...unique.keys()].map((id) => byId.get(id)?.avatar_url).filter((p): p is string => Boolean(p));
    const signed = paths.length ? await context.supabase.storage.from("ministry-avatars").createSignedUrls(paths, 3600) : null;
    const urls = new Map((signed?.data ?? []).map((s) => [s.path, s.signedUrl]));
    return [...unique].map(([memberId, conversationId]) => ({
      conversationId,
      memberId,
      name: byId.get(memberId)?.display_name || "A neighbor",
      avatarUrl: urls.get(byId.get(memberId)?.avatar_url ?? "") ?? null,
    }));
  });

export const completeNeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => needId.extend({
    helperConversationId: z.string().uuid().nullable(),
    replies: z.array(z.object({ conversationId: z.string().uuid(), body: z.string().trim().min(1).max(1000) })).max(100),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("complete_user_need", {
      _need_id: data.needId,
      _helper_conversation_id: data.helperConversationId,
      _replies: data.replies,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reopenNeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => needId.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("reopen_user_need", { _need_id: data.needId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });