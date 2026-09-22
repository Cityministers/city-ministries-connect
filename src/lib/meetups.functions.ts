import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MeetupDTO = {
  id: string;
  meetAt: string;
  location: string;
  lat: number | null;
  lng: number | null;
  status: "pending" | "accepted" | "declined";
  responseNote: string | null;
  mine: boolean;
  createdAt: string;
};

/** Attaches a meetup request (day, time, place) to a conversation. */
export const createMeetupRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        meetAt: z.string().datetime(),
        location: z.string().trim().min(1).max(200),
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    if (new Date(data.meetAt).getTime() < Date.now() - 60_000) {
      throw new Error("Please choose a time in the future.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: parts } = await supabaseAdmin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", data.conversationId);
    const ids = (parts ?? []).map((p) => p.user_id);
    if (!ids.includes(context.userId)) throw new Error("Conversation not found.");
    const other = ids.find((id) => id !== context.userId);
    if (!other) throw new Error("Conversation not found.");

    const { error } = await context.supabase.from("meetup_requests").insert({
      conversation_id: data.conversationId,
      requester_id: context.userId,
      recipient_id: other,
      meet_at: data.meetAt,
      location: data.location,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
    });
    if (error) throw new Error(error.message);

    const { notifyUser, displayNameOf } = await import("./social.server");
    await notifyUser({
      userId: other,
      actorId: context.userId,
      kind: "message",
      title: `${await displayNameOf(context.userId)} asked to meet up`,
      body: `${data.location}`.slice(0, 140),
      link: `/messages/${data.conversationId}`,
    });
    return { ok: true };
  });

export const listMeetupsForConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ conversationId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<MeetupDTO[]> => {
    const { data: rows } = await context.supabase
      .from("meetup_requests")
      .select("id, meet_at, location, lat, lng, status, response_note, requester_id, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    return (rows ?? []).map((r) => ({
      id: r.id,
      meetAt: r.meet_at,
      location: r.location,
      lat: r.lat,
      lng: r.lng,
      status: r.status as MeetupDTO["status"],
      responseNote: r.response_note,
      mine: r.requester_id === context.userId,
      createdAt: r.created_at,
    }));
  });

export const respondToMeetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        accept: z.boolean(),
        later: z.boolean().optional(),
        note: z.string().trim().max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("meetup_requests")
      .select("id, conversation_id, requester_id, recipient_id, status, location")
      .eq("id", data.id)
      .maybeSingle();
    if (!row || (row.recipient_id !== context.userId && row.requester_id !== context.userId))
      throw new Error("Meetup not found.");
    const otherId = row.requester_id === context.userId ? row.recipient_id : row.requester_id;
    const { notifyUser, displayNameOf } = await import("./social.server");
    const name = await displayNameOf(context.userId);

    if (data.later) {
      await notifyUser({
        userId: otherId,
        actorId: context.userId,
        kind: "message",
        title: `${name} will get back to you about your meetup`,
        body: row.location.slice(0, 140),
        link: `/messages/${row.conversation_id}`,
      });
      return { ok: true };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("meetup_requests")
      .update({
        status: data.accept ? "accepted" : "declined",
        response_note: data.note || null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await notifyUser({
      userId: otherId,
      actorId: context.userId,
      kind: "message",
      title: data.accept ? `${name} accepted your meetup` : `${name} declined your meetup`,
      body: (data.note || row.location).slice(0, 140),
      link: `/messages/${row.conversation_id}`,
    });
    return { ok: true };
  });

export type MyMeetupDTO = MeetupDTO & {
  conversationId: string;
  otherName: string;
  otherAvatar: string | null;
};

/** Every meetup the signed-in person sent or received, soonest first. */
export const listMyMeetups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyMeetupDTO[]> => {
    const { data: rows } = await context.supabase
      .from("meetup_requests")
      .select(
        "id, conversation_id, meet_at, location, lat, lng, status, response_note, requester_id, recipient_id, created_at",
      )
      .or(`requester_id.eq.${context.userId},recipient_id.eq.${context.userId}`)
      .neq("status", "declined")
      .order("meet_at", { ascending: true })
      .limit(200);
    const list = rows ?? [];
    const otherIds = [
      ...new Set(list.map((r) => (r.requester_id === context.userId ? r.recipient_id : r.requester_id))),
    ];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profs } = otherIds.length
      ? await supabaseAdmin.from("profiles").select("id, display_name, avatar_url").in("id", otherIds)
      : { data: [] as { id: string; display_name: string | null; avatar_url: string | null }[] };
    const byId = new Map((profs ?? []).map((p) => [p.id, p]));
    return list.map((r) => {
      const other = r.requester_id === context.userId ? r.recipient_id : r.requester_id;
      const p = byId.get(other);
      return {
        id: r.id,
        conversationId: r.conversation_id,
        meetAt: r.meet_at,
        location: r.location,
        lat: r.lat,
        lng: r.lng,
        status: r.status as MeetupDTO["status"],
        responseNote: r.response_note,
        mine: r.requester_id === context.userId,
        createdAt: r.created_at,
        otherName: p?.display_name || "A neighbor",
        otherAvatar: p?.avatar_url ?? null,
      };
    });
  });
