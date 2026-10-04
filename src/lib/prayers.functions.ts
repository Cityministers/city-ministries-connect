import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { countrySchema, postalSchema, validLocation } from "./country";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type PrayerDTO = {
  id: string;
  ownerId: string | null;
  churchId: string | null;
  shortTitle: string;
  body: string;
  city: string;
  zip: string;
  country: string;
  lat: number | null;
  lng: number | null;
  anonymous: boolean;
  createdAt: string;
  posterName: string;
  posterPhotoUrl: string | null;
  imageUrl: string | null;
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

type Row = {
  id: string;
  owner_id: string;
  church_id: string | null;
  short_title: string;
  body: string;
  city: string;
  zip: string | null;
  country_code: string;
  lat: number | null;
  lng: number | null;
  anonymous: boolean;
  image_url: string | null;
  created_at: string;
};

/** Adds the poster's name and photo, unless the prayer was posted anonymously. */
async function decorate(
  supabase: ReturnType<typeof publicClient>,
  rows: Row[],
): Promise<PrayerDTO[]> {
  const named = rows.filter((r) => !r.anonymous);
  const ownerIds = [...new Set(named.map((r) => r.owner_id))];
  const profileById = new Map<string, { display_name: string | null; avatar_url: string | null }>();
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", ownerIds);
    for (const p of profiles ?? []) profileById.set(p.id, p);
  }

  const paths = [
    ...[...profileById.values()].map((p) => p.avatar_url),
    ...rows.map((r) => r.image_url),
  ].filter((p): p is string => Boolean(p));
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

  return rows.map((r) => {
    const profile = r.anonymous ? undefined : profileById.get(r.owner_id);
    const photo = profile?.avatar_url ? (urlByPath.get(profile.avatar_url) ?? null) : null;
    return {
      id: r.id,
      ownerId: r.anonymous ? null : r.owner_id,
      churchId: r.church_id,
      shortTitle: r.short_title,
      body: r.body,
      city: r.city,
      zip: r.zip ?? "",
      country: r.country_code ?? "US",
      lat: r.lat,
      lng: r.lng,
      anonymous: r.anonymous,
      createdAt: r.created_at,
      posterName: r.anonymous ? "Anonymous" : profile?.display_name || "A neighbor",
      posterPhotoUrl: photo,
      imageUrl: r.image_url ? (urlByPath.get(r.image_url) ?? null) : null,
    };
  });
}

const COLUMNS =
  "id, owner_id, church_id, short_title, body, city, zip, country_code, lat, lng, anonymous, image_url, created_at";

/** Prayers shown on the map — public prayers plus prayers a church approved. */
export const listPublicPrayers = createServerFn({ method: "GET" }).handler(
  async (): Promise<PrayerDTO[]> => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("prayers")
      .select(COLUMNS)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error || !data) return [];

    // Prayers are placed on the map from their city/ZIP the first time they're listed.
    const unplaced = data.filter((r) => r.lat == null || r.lng == null);
    if (unplaced.length > 0) {
      const { geocodePlaces, placeKey } = await import("./geocode.server");
      const found = await geocodePlaces(
        unplaced.map((r) => ({ city: r.city ?? "", zip: r.zip ?? "", country: r.country_code })),
      );
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      for (const r of unplaced) {
        const point = found.get(placeKey(r.city ?? "", r.zip ?? "", r.country_code));
        if (!point) continue;
        r.lat = point.lat;
        r.lng = point.lng;
        await supabaseAdmin
          .from("prayers")
          .update({ lat: point.lat, lng: point.lng })
          .eq("id", r.id);
      }
    }

    return decorate(supabase, data as Row[]);
  },
);

/** The prayer wall for one church. */
export const listChurchPrayers = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ churchId: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<PrayerDTO[]> => {
    const supabase = publicClient();
    const { data: rows, error } = await supabase
      .from("prayers")
      .select(COLUMNS)
      .eq("church_id", data.churchId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error || !rows) return [];
    return decorate(supabase, rows as Row[]);
  });

const createInput = z.object({
  shortTitle: z.string().trim().min(2).max(60),
  body: z.string().trim().min(5).max(1000),
  city: z.string().trim().max(80).optional().default(""),
  zip: postalSchema.optional().default(""),
  country: countrySchema.default("US"),
  churchId: z.string().uuid().nullable().optional().default(null),
  anonymous: z.boolean().optional().default(false),
  imagePath: z.string().trim().max(300).nullable().optional().default(null),
});

export const createPrayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data, context }) => {
    if (!data.churchId && !validLocation(data.city, data.zip)) {
      throw new Error("Enter the city or ZIP where this prayer belongs.");
    }

    const { data: row, error } = await context.supabase
      .from("prayers")
      .insert({
        owner_id: context.userId,
        church_id: data.churchId,
        short_title: data.shortTitle,
        body: data.body,
        city: data.city,
        zip: data.zip,
        country_code: data.country,
        anonymous: data.anonymous,
        image_url: data.imagePath,
        // Prayers sent to a church wait for the pastor; map prayers go live.
        status: data.churchId ? "pending" : "active",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, pending: Boolean(data.churchId) };
  });

/** Prayers waiting for review at a church the caller owns or moderates. */
export const listPendingChurchPrayers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ churchId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<PrayerDTO[]> => {
    const { data: church } = await context.supabase
      .from("churches")
      .select("id, owner_id")
      .eq("id", data.churchId)
      .maybeSingle();
    if (!church) return [];

    let mayReview = church.owner_id === context.userId;
    if (!mayReview) {
      const { data: mod } = await context.supabase
        .from("church_members")
        .select("id")
        .eq("church_id", data.churchId)
        .eq("user_id", context.userId)
        .eq("role", "moderator")
        .eq("status", "approved")
        .maybeSingle();
      mayReview = Boolean(mod);
    }
    if (!mayReview) return [];

    const { data: rows } = await context.supabase
      .from("prayers")
      .select(COLUMNS)
      .eq("church_id", data.churchId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100);
    return decorate(publicClient(), (rows ?? []) as Row[]);
  });

/** Prayer + church when the caller may moderate it: the church's owner or an approved moderator. */
async function ownsChurchPrayer(
  supabase: ReturnType<typeof publicClient>,
  userId: string,
  prayerId: string,
) {
  const { data: prayer } = await supabase
    .from("prayers")
    .select("id, owner_id, church_id, short_title, lat, lng")
    .eq("id", prayerId)
    .maybeSingle();
  if (!prayer?.church_id) return null;
  const { data: church } = await supabase
    .from("churches")
    .select("id, name, owner_id, lat, lng")
    .eq("id", prayer.church_id)
    .maybeSingle();
  if (!church) return null;
  if (church.owner_id !== userId) {
    const { data: mod } = await supabase
      .from("church_members")
      .select("id")
      .eq("church_id", prayer.church_id)
      .eq("user_id", userId)
      .eq("role", "moderator")
      .eq("status", "approved")
      .maybeSingle();
    if (!mod) return null;
  }
  return { prayer, church };
}

/** The pastor lets a prayer onto the church wall. */
export const approveChurchPrayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const found = await ownsChurchPrayer(context.supabase, context.userId, data.id);
    if (!found) throw new Error("You can only review prayers at your own church.");

    // Approved prayers join the map: they take the church's own coordinates
    // unless the poster already placed them somewhere.
    const { error } = await context.supabase
      .from("prayers")
      .update({
        status: "active",
        lat: found.prayer.lat ?? found.church.lat,
        lng: found.prayer.lng ?? found.church.lng,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("notifications").insert({
      user_id: found.prayer.owner_id,
      kind: "prayer_approved",
      title: "Your prayer is on the wall",
      body: `${found.church.name} approved "${found.prayer.short_title}".`,
      link: `/church/${found.church.id}`,
    });
    return { ok: true };
  });

/** The pastor turns a prayer request down. */
export const declineChurchPrayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const found = await ownsChurchPrayer(context.supabase, context.userId, data.id);
    if (!found) throw new Error("You can only review prayers at your own church.");
    const { error } = await context.supabase.from("prayers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** How many approved prayers arrived at each church since the caller last looked. */
export const churchPrayerCounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ churchIds: z.array(z.string().uuid()).max(50) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<Record<string, number>> => {
    if (data.churchIds.length === 0) return {};
    const { data: views } = await context.supabase
      .from("church_prayer_views")
      .select("church_id, last_seen_at")
      .eq("user_id", context.userId)
      .in("church_id", data.churchIds);
    const seenAt = new Map((views ?? []).map((v) => [v.church_id, v.last_seen_at]));

    const { data: rows } = await publicClient()
      .from("prayers")
      .select("church_id, created_at")
      .in("church_id", data.churchIds)
      .eq("status", "active")
      .limit(500);

    const counts: Record<string, number> = {};
    for (const id of data.churchIds) counts[id] = 0;
    for (const r of rows ?? []) {
      if (!r.church_id) continue;
      const since = seenAt.get(r.church_id);
      if (since && new Date(r.created_at) <= new Date(since)) continue;
      counts[r.church_id] = (counts[r.church_id] ?? 0) + 1;
    }
    return counts;
  });

/** Remembers that the caller just opened a church's prayer wall. */
export const markChurchPrayersSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ churchId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await context.supabase.from("church_prayer_views").upsert(
      {
        user_id: context.userId,
        church_id: data.churchId,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,church_id" },
    );
    return { ok: true };
  });

export const deletePrayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    // RLS allows the poster, the church owner and the church's moderators.
    const { error } = await context.supabase.from("prayers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Hides a prayer (poster, church owner or moderator): off the wall and map, record kept. */
export const hidePrayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    // RLS allows the poster, the church owner and the church's moderators.
    const { error } = await context.supabase
      .from("prayers")
      .update({ status: "hidden" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Whether the signed-in visitor may moderate a prayer (poster, church owner or moderator). */
export const myPrayerPowers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [churches, modRows] = await Promise.all([
      context.supabase.from("churches").select("id").eq("owner_id", context.userId),
      context.supabase
        .from("church_members")
        .select("church_id")
        .eq("user_id", context.userId)
        .eq("role", "moderator")
        .eq("status", "approved"),
    ]);
    return {
      userId: context.userId,
      churchIds: (churches.data ?? []).map((c) => c.id),
      moderatorChurchIds: [...new Set((modRows.data ?? []).map((m) => m.church_id))],
    };
  });
