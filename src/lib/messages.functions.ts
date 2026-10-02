import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ConversationDTO = {
  id: string;
  otherName: string;
  otherPhotoUrl: string | null;
  subject: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
};

export type ThreadMessageDTO = {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
};

async function signedAvatar(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from("ministry-avatars")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

export const listMyConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConversationDTO[]> => {
    const { data: mine } = await context.supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", context.userId);
    if (!mine || mine.length === 0) return [];

    const ids = mine.map((m) => m.conversation_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: convos }, { data: others }, { data: msgs }] = await Promise.all([
      supabaseAdmin
        .from("conversations")
        .select("id, post_type, post_id, last_message_at")
        .in("id", ids)
        .order("last_message_at", { ascending: false }),
      supabaseAdmin
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", ids)
        .neq("user_id", context.userId),
      supabaseAdmin
        .from("messages")
        .select("conversation_id, body, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const otherIds = [...new Set((others ?? []).map((o) => o.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", otherIds.length > 0 ? otherIds : ["00000000-0000-0000-0000-000000000000"]);
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    const subjectByConvo = new Map<string, string>();
    for (const c of convos ?? []) {
      if (!c.post_id || !c.post_type) continue;
      const table = c.post_type === "need" ? "user_needs" : "user_ministries";
      const { data: post } = await supabaseAdmin
        .from(table)
        .select("short_title")
        .eq("id", c.post_id)
        .maybeSingle();
      if (post) subjectByConvo.set(c.id, post.short_title);
    }

    const { data: pendingMeetups } = await supabaseAdmin
      .from("meetup_requests")
      .select("conversation_id, requester_id, status, updated_at")
      .in("conversation_id", ids)
      .order("updated_at", { ascending: false });

    const out: ConversationDTO[] = [];
    for (const c of convos ?? []) {
      const otherId = (others ?? []).find((o) => o.conversation_id === c.id)?.user_id;
      const profile = otherId ? profileById.get(otherId) : undefined;
      const last = (msgs ?? []).find((m) => m.conversation_id === c.id);
      const lastRead = mine.find((m) => m.conversation_id === c.id)?.last_read_at ?? "";
      out.push({
        id: c.id,
        otherName: profile?.display_name || "A neighbor",
        otherPhotoUrl: await signedAvatar(profile?.avatar_url ?? null),
        subject: subjectByConvo.get(c.id) ?? "",
        lastMessage: (() => {
          const pm = (pendingMeetups ?? []).find((p) => p.conversation_id === c.id);
          if (!pm) return last?.body ?? "";
          if (pm.status !== "pending") {
            if (last && last.created_at > pm.updated_at) return last.body;
            return pm.status === "accepted" ? "📅 Meetup accepted" : "📅 Meetup declined";
          }
          return pm.requester_id === context.userId
            ? "📅 Meetup request · Awaiting reply"
            : "📅 Meetup request · Tap to accept or decline";
        })(),
        lastMessageAt: c.last_message_at,
        unread: Boolean(last && lastRead && last.created_at > lastRead) || Boolean(last && !lastRead),
      });
    }
    return out;
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: member } = await context.supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!member) throw new Error("Conversation not found.");

    const { data: rows } = await context.supabase
      .from("messages")
      .select("id, body, sender_id, created_at")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true })
      .limit(300);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // What post this conversation is about, so nobody loses the thread.
    const { data: convo } = await supabaseAdmin
      .from("conversations")
      .select("post_type, post_id")
      .eq("id", data.id)
      .maybeSingle();
    let subject = "";
    let subjectKind: "ministry" | "need" | "prayer" | null = null;
    if (convo?.post_id && convo.post_type) {
      subjectKind = convo.post_type;
      const table =
        convo.post_type === "need"
          ? "user_needs"
          : convo.post_type === "prayer"
            ? "prayers"
            : "user_ministries";
      const { data: post } = await supabaseAdmin
        .from(table)
        .select("short_title")
        .eq("id", convo.post_id)
        .maybeSingle();
      subject = post?.short_title ?? "";
    }

    const { data: other } = await supabaseAdmin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", data.id)
      .neq("user_id", context.userId)
      .maybeSingle();
    const { data: profile } = other
      ? await supabaseAdmin
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", other.user_id)
          .maybeSingle()
      : { data: null };

    await context.supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", data.id)
      .eq("user_id", context.userId);

    const messages: ThreadMessageDTO[] = (rows ?? []).map((r) => ({
      id: r.id,
      body: r.body,
      mine: r.sender_id === context.userId,
      createdAt: r.created_at,
    }));

    return {
      otherName: profile?.display_name || "A neighbor",
      otherPhotoUrl: await signedAvatar(profile?.avatar_url ?? null),
      subject,
      subjectKind,
      messages,
    };
  });

/** Starts (or reuses) a conversation with a poster and sends the first note. */
export const startConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        postType: z.enum(["ministry", "need", "prayer"]),
        postId: z.string().uuid(),
        body: z.string().trim().min(1).max(1000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { getPostOwner, notifyUser, displayNameOf } = await import("./social.server");
    const owner = await getPostOwner(data.postType, data.postId);
    if (!owner) throw new Error("That post is no longer available.");
    if (data.postType === "need") {
      const { data: need } = await context.supabase.from("user_needs").select("status").eq("id", data.postId).maybeSingle();
      if (need?.status !== "active") throw new Error("This need has already been met.");
    }
    if (owner.ownerId === context.userId) throw new Error("This is your own post.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Reuse an existing thread about this post between these two people.
    const { data: mine } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", context.userId);
    const myIds = (mine ?? []).map((m) => m.conversation_id);
    let conversationId: string | null = null;
    if (myIds.length > 0) {
      const { data: shared } = await supabaseAdmin
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", owner.ownerId)
        .in("conversation_id", myIds);
      const sharedIds = (shared ?? []).map((s) => s.conversation_id);
      if (sharedIds.length > 0) {
        const { data: existing } = await supabaseAdmin
          .from("conversations")
          .select("id")
          .in("id", sharedIds)
          .eq("post_type", data.postType)
          .eq("post_id", data.postId)
          .maybeSingle();
        conversationId = existing?.id ?? null;
      }
    }

    if (!conversationId) {
      const { data: convo, error } = await supabaseAdmin
        .from("conversations")
        .insert({ post_type: data.postType, post_id: data.postId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversationId = convo.id;
      await supabaseAdmin.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: context.userId },
        { conversation_id: conversationId, user_id: owner.ownerId },
      ]);
    }

    await sendMessageRow(conversationId, context.userId, data.body);
    await notifyUser({
      userId: owner.ownerId,
      actorId: context.userId,
      kind: "message",
      title: `${await displayNameOf(context.userId)} sent you a message`,
      body: data.body.slice(0, 140),
      link: `/messages/${conversationId}`,
    });
    await maybeDemoReply(conversationId, owner.ownerId, context.userId);
    return { conversationId };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        body: z.string().trim().min(1).max(1000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("messages").insert({
      conversation_id: data.conversationId,
      sender_id: context.userId,
      body: data.body,
    });
    if (error) throw new Error(error.message);

    await context.supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", data.conversationId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: other } = await supabaseAdmin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", data.conversationId)
      .neq("user_id", context.userId)
      .maybeSingle();

    if (other) {
      const { notifyUser, displayNameOf } = await import("./social.server");
      await notifyUser({
        userId: other.user_id,
        actorId: context.userId,
        kind: "message",
        title: `${await displayNameOf(context.userId)} sent you a message`,
        body: data.body.slice(0, 140),
        link: `/messages/${data.conversationId}`,
      });
      await maybeDemoReply(data.conversationId, other.user_id, context.userId);
    }
    return { ok: true };
  });

/**
 * Sample neighbours (demo profiles) answer back once, so visitors can see a
 * real two-way conversation while testing.
 */
async function maybeDemoReply(conversationId: string, otherUserId: string, toUserId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("display_name, is_demo")
    .eq("id", otherUserId)
    .maybeSingle();
  if (!profile?.is_demo) return;

  // Only auto-answer when they haven't spoken in this thread yet.
  const { data: already } = await supabaseAdmin
    .from("messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("sender_id", otherUserId)
    .limit(1);
  if ((already ?? []).length > 0) return;

  const name = profile.display_name || "A neighbor";
  const replies = [
    "Thanks so much for reaching out! I'd love to help. What day works best for you?",
    "Hi neighbor! Yes, I'm still available. Tell me a little more about what you need.",
    "So glad you messaged. I'm usually free evenings and Saturday mornings — does either work?",
    "Praise God, happy to connect! Let me know where you're at and we'll set something up.",
  ];
  const body = replies[Math.floor(Math.random() * replies.length)]!;
  await sendMessageRow(conversationId, otherUserId, body);

  const { notifyUser } = await import("./social.server");
  await notifyUser({
    userId: toUserId,
    actorId: otherUserId,
    kind: "message",
    title: `${name} replied to your message`,
    body,
    link: `/messages/${conversationId}`,
  });
}

async function sendMessageRow(conversationId: string, senderId: string, body: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body });
  await supabaseAdmin
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}
