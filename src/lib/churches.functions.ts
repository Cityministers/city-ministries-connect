import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { countrySchema, postalSchema } from "./country";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type ChurchDTO = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  iconId: string;
  photoUrl: string | null;
  gallery: { url: string; kind: "image" | "video" }[];
  address: string;
  city: string;
  zip: string;
  country: string;
  lat: number | null;
  lng: number | null;
  serviceTimes: string;
  phone: string;
  website: string;
  status: string;
  planStatus: string;
  currentPeriodEnd: string | null;
};

type GalleryItem = { path: string; kind: "image" | "video" };

function galleryPaths(raw: unknown): GalleryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((g) => g as { path?: unknown; kind?: unknown })
    .filter(
      (g): g is GalleryItem =>
        typeof g.path === "string" && (g.kind === "image" || g.kind === "video"),
    )
    .map((g) => ({ path: g.path, kind: g.kind }));
}

export type ChurchPostDTO = {
  linkId: string;
  kind: "ministry" | "need" | "prayer";
  postId: string;
  title: string;
  description: string;
  city: string;
  zip: string;
  country: string;
  status: string;
  posterName: string;
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

type ChurchRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  icon_id: string;
  avatar_url: string | null;
  address: string;
  city: string;
  zip: string;
  country: string;
  lat: number | null;
  lng: number | null;
  service_times: string;
  phone: string;
  website: string;
  status: string;
  plan_status: string;
  current_period_end: string | null;
  gallery: unknown;
};

const CHURCH_COLUMNS =
  "id, owner_id, name, description, icon_id, avatar_url, address, city, zip, country_code, lat, lng, service_times, phone, website, status, plan_status, current_period_end, gallery";

async function signPaths(paths: string[]): Promise<Map<string, string>> {
  const urlByPath = new Map<string, string>();
  const wanted = paths.filter((p) => p.length > 0);
  if (wanted.length === 0) return urlByPath;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: signed } = await supabaseAdmin.storage
    .from("ministry-avatars")
    .createSignedUrls(wanted, 60 * 60 * 24 * 7);
  for (const s of signed ?? []) {
    if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
  }
  return urlByPath;
}

function toChurch(row: ChurchRow, urlByPath: Map<string, string>): ChurchDTO {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    iconId: row.icon_id,
    photoUrl: row.avatar_url ? (urlByPath.get(row.avatar_url) ?? null) : null,
    gallery: galleryPaths(row.gallery)
      .map((g) => ({ url: urlByPath.get(g.path) ?? "", kind: g.kind }))
      .filter((g) => g.url.length > 0),
    address: row.address,
    city: row.city,
    zip: row.zip,
    country: row.country_code ?? "US",
    lat: row.lat,
    lng: row.lng,
    serviceTimes: row.service_times,
    phone: row.phone,
    website: row.website,
    status: row.status,
    planStatus: row.plan_status,
    currentPeriodEnd: row.current_period_end,
  };
}

/** Active churches for the map, placed on their exact street address. */
export const listChurches = createServerFn({ method: "GET" }).handler(
  async (): Promise<ChurchDTO[]> => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("churches")
      .select(CHURCH_COLUMNS)
      .eq("status", "active")
      .not("lat", "is", null)
      .not("lng", "is", null)
      .limit(200);
    if (error || !data) return [];
    const rows = data as ChurchRow[];
    const urlByPath = await signPaths(
      rows.map((r) => r.avatar_url).filter((p): p is string => Boolean(p)),
    );
    return rows.map((r) => toChurch(r, urlByPath));
  },
);

/** One church plus the posts at it — the public church page. */
export const getChurch = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(
    async ({
      data,
    }): Promise<{
      church: ChurchDTO | null;
      posts: ChurchPostDTO[];
      nearby: ChurchPostDTO[];
    }> => {
      const supabase = publicClient();
      const { data: row } = await supabase
        .from("churches")
        .select(CHURCH_COLUMNS)
        .eq("id", data.id)
        .maybeSingle();
      if (!row) return { church: null, posts: [], nearby: [] };
      const church = row as ChurchRow;
      const urlByPath = await signPaths([
        ...(church.avatar_url ? [church.avatar_url] : []),
        ...galleryPaths(church.gallery).map((g) => g.path),
      ]);

      const { data: links } = await supabase
        .from("church_posts")
        .select("id, post_type, post_id, status")
        .eq("church_id", church.id)
        .eq("status", "approved");

      const ministryIds = (links ?? [])
        .filter((l) => l.post_type === "ministry")
        .map((l) => l.post_id);
      const needIds = (links ?? []).filter((l) => l.post_type === "need").map((l) => l.post_id);

      const [{ data: ministries }, { data: needs }] = await Promise.all([
        ministryIds.length
          ? supabase
              .from("user_ministries")
              .select("id, owner_id, short_title, title, description, city, zip")
              .in("id", ministryIds)
          : Promise.resolve({ data: [] as never[] }),
        needIds.length
          ? supabase
              .from("user_needs")
              .select("id, owner_id, short_title, title, description, city, zip")
              .in("id", needIds)
              .eq("status", "active")
          : Promise.resolve({ data: [] as never[] }),
      ]);

      // Public posts in the same place that aren't attached to any church.
      const place = church.zip || church.city;
      const column = church.zip ? "zip" : "city";
      const [
        { data: nearMinistries },
        { data: nearNeeds },
        { data: nearPrayers },
        { data: takenLinks },
      ] = await Promise.all([
        place
          ? supabase
              .from("user_ministries")
              .select("id, owner_id, short_title, title, description, city, zip")
              .eq(column, place)
              .eq("status", "active")
              .limit(40)
          : Promise.resolve({ data: [] as never[] }),
        place
          ? supabase
              .from("user_needs")
              .select("id, owner_id, short_title, title, description, city, zip")
              .eq(column, place)
              .limit(40)
          : Promise.resolve({ data: [] as never[] }),
        place
          ? supabase
              .from("prayers")
              .select("id, owner_id, short_title, body, city, zip, anonymous")
              .is("church_id", null)
              .eq("status", "active")
              .eq(column, place)
              .limit(40)
          : Promise.resolve({ data: [] as never[] }),
        supabase.from("church_posts").select("post_id").eq("status", "approved"),
      ]);

      const taken = new Set((takenLinks ?? []).map((l) => l.post_id));

      type PostRow = {
        id: string;
        owner_id: string;
        short_title: string;
        title: string | null;
        description: string;
        city: string;
        zip: string | null;
      };

      type PrayerRow = {
        id: string;
        owner_id: string | null;
        short_title: string | null;
        body: string;
        city: string;
        zip: string | null;
        anonymous: boolean;
      };

      const prayerOwnerIds = ((nearPrayers ?? []) as PrayerRow[])
        .filter((p) => !p.anonymous && p.owner_id)
        .map((p) => p.owner_id as string);
      const ownerIds = [
        ...new Set(
          [
            ...((ministries ?? []) as PostRow[]),
            ...((needs ?? []) as PostRow[]),
            ...((nearMinistries ?? []) as PostRow[]),
            ...((nearNeeds ?? []) as PostRow[]),
            ...prayerOwnerIds.map((owner_id) => ({ owner_id })),
          ].map((p) => p.owner_id),
        ),
      ];
      const { data: profiles } = ownerIds.length
        ? await supabase.from("profiles").select("id, display_name").in("id", ownerIds)
        : { data: [] as { id: string; display_name: string | null }[] };
      const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

      const linkIdFor = (kind: "ministry" | "need", postId: string) =>
        (links ?? []).find((l) => l.post_type === kind && l.post_id === postId)?.id ?? postId;

      const shape = (
        rows: PostRow[],
        kind: "ministry" | "need",
        withLink: boolean,
      ): ChurchPostDTO[] =>
        rows.map((p) => ({
          linkId: withLink ? linkIdFor(kind, p.id) : `near-${p.id}`,
          kind,
          postId: p.id,
          title: p.short_title || p.title || "Post",
          description: p.description,
          city: p.city,
          zip: p.zip ?? "",
          status: withLink ? "approved" : "public",
          posterName: nameById.get(p.owner_id) || "A neighbor",
        }));

      const shapePrayers = (rows: PrayerRow[]): ChurchPostDTO[] =>
        rows.map((p) => ({
          linkId: `near-prayer-${p.id}`,
          kind: "prayer" as const,
          postId: p.id,
          title: p.short_title || "Prayer request",
          description: p.body,
          city: p.city,
          zip: p.zip ?? "",
          status: "public",
          posterName: p.anonymous ? "Anonymous" : (p.owner_id ? nameById.get(p.owner_id) : null) || "A neighbor",
        }));

      const posts = [
        ...shape((ministries ?? []) as PostRow[], "ministry", true),
        ...shape((needs ?? []) as PostRow[], "need", true),
      ];
      const nearby = [
        ...shape((nearMinistries ?? []) as PostRow[], "ministry", false),
        ...shape((nearNeeds ?? []) as PostRow[], "need", false),
        ...shapePrayers((nearPrayers ?? []) as PrayerRow[]),
      ].filter((p) => !taken.has(p.postId));

      return { church: toChurch(church, urlByPath), posts, nearby: nearby.slice(0, 30) };
    },
  );

/** Churches near a city or ZIP, for the picker on the post forms. */
export const listChurchesNear = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ city: z.string().trim().max(80), zip: z.string().trim().max(10) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ id: string; name: string; city: string; zip: string }[]> => {
    const supabase = publicClient();
    const { data: rows } = await supabase
      .from("churches")
      .select("id, name, city, zip")
      .eq("status", "active")
      .limit(100);
    const all = rows ?? [];
    const city = data.city.trim().toLowerCase();
    const zip = data.zip.trim();
    const near = all.filter(
      (c) => (zip && c.zip === zip) || (city && (c.city ?? "").toLowerCase() === city),
    );
    return (near.length > 0 ? near : all).slice(0, 25).map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city ?? "",
      zip: c.zip ?? "",
    }));
  });

const churchInput = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(600).optional().default(""),
  iconId: z
    .enum(["chapel", "cross", "hall", "orthodox", "dome", "cathedral"])
    .optional()
    .default("chapel"),
  avatarPath: z.string().trim().max(300).optional().default(""),
  address: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  zip: postalSchema.refine((value) => value.length >= 3, "Enter a postal code.").default(""),
  country: countrySchema.default("US"),
  serviceTimes: z.string().trim().max(200).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  website: z.string().trim().max(200).optional().default(""),
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
});

export const createChurch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => churchInput.parse(data))
  .handler(async ({ data, context }): Promise<{ id: string; located: boolean }> => {
    // Their own church with the same name is the same church — a retry after a
    // failed address lookup, not a duplicate. Someone else's church never blocks them.
    const { data: mine } = await context.supabase
      .from("churches")
      .select("id")
      .eq("owner_id", context.userId)
      .ilike("name", data.name)
      .eq("zip", data.zip)
      .limit(1)
      .maybeSingle();
    if (mine) {
      const { geocodeChurch: locate } = await import("./geocode.server");
      const spot = await locate(data.address, data.city, data.zip, data.country);
      await context.supabase
        .from("churches")
        .update({
          status: "active",
          description: data.description,
          icon_id: data.iconId,
          avatar_url: data.avatarPath || null,
          ...(data.gallery.length > 0 ? { gallery: data.gallery } : {}),
          address: data.address,
          city: data.city,
          zip: data.zip,
        country_code: data.country,
          service_times: data.serviceTimes,
          phone: data.phone,
          website: data.website,
          lat: spot?.lat ?? null,
          lng: spot?.lng ?? null,
        })
        .eq("id", mine.id)
        .eq("owner_id", context.userId);
      return { id: mine.id, located: Boolean(spot) };
    }
    const { data: row, error } = await context.supabase
      .from("churches")
      .insert({
        owner_id: context.userId,
        name: data.name,
        description: data.description,
        icon_id: data.iconId,
        avatar_url: data.avatarPath || null,
        gallery: data.gallery,
        address: data.address,
        city: data.city,
        zip: data.zip,
        country_code: data.country,
        service_times: data.serviceTimes,
        phone: data.phone,
        website: data.website,
        status: "active",
        plan_status: "free",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Churches are real buildings, so we place them on their exact address.
    const { geocodeChurch: geocodeAddress } = await import("./geocode.server");
    const point = await geocodeAddress(data.address, data.city, data.zip, data.country);
    if (point) {
      await context.supabase
        .from("churches")
        .update({ lat: point.lat, lng: point.lng })
        .eq("id", row.id)
        .eq("owner_id", context.userId);
    }
    return { id: row.id, located: Boolean(point) };
  });

export const updateChurch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    churchInput.extend({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; located: boolean }> => {
    // An edited address is looked up again so the pin follows the building.
    const { geocodeChurch: geocodeAddress } = await import("./geocode.server");
    const point = await geocodeAddress(data.address, data.city, data.zip, data.country);

    const { error } = await context.supabase
      .from("churches")
      .update({
        name: data.name,
        description: data.description,
        icon_id: data.iconId,
        ...(data.avatarPath ? { avatar_url: data.avatarPath } : {}),
        ...(data.gallery.length > 0 ? { gallery: data.gallery } : {}),
        address: data.address,
        city: data.city,
        zip: data.zip,
        country_code: data.country,
        service_times: data.serviceTimes,
        phone: data.phone,
        website: data.website,
        lat: point?.lat ?? null,
        lng: point?.lng ?? null,
      })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, located: Boolean(point) };
  });

/** Runs the address lookup again for a church that couldn't be placed. */
export const relocateChurch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<{ located: boolean }> => {
    const { data: church } = await context.supabase
      .from("churches")
      .select("owner_id, address, city, zip")
      .eq("id", data.id)
      .maybeSingle();
    if (!church || church.owner_id !== context.userId) return { located: false };

    const { geocodeChurch: geocodeAddress } = await import("./geocode.server");
    const point = await geocodeAddress(church.address ?? "", church.city ?? "", church.zip ?? "");
    if (!point) return { located: false };

    await context.supabase
      .from("churches")
      .update({ lat: point.lat, lng: point.lng })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    return { located: true };
  });

export const deleteChurch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("churches")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Mock checkout: records a $49 charge and keeps the church on the map for a month. */
export const mockSubscribe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        cardName: z.string().trim().min(2).max(80),
        cardNumber: z.string().trim().min(12).max(24),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; periodEnd: string }> => {
    const { data: church } = await context.supabase
      .from("churches")
      .select("id, owner_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!church || church.owner_id !== context.userId) throw new Error("Church not found.");

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await context.supabase.from("church_payments").insert({
      church_id: data.id,
      payer_id: context.userId,
      amount_cents: 4900,
      status: "paid",
      is_mock: true,
    });

    const { error } = await context.supabase
      .from("churches")
      .update({
        status: "active",
        plan_status: "active",
        current_period_end: periodEnd.toISOString(),
      })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, periodEnd: periodEnd.toISOString() };
  });

/** A poster asks for their ministry or need to be listed at a church. */
export const requestChurchPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        churchId: z.string().uuid(),
        kind: z.enum(["ministry", "need"]),
        postId: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; status: "approved" | "pending" }> => {
    const { data: trusted } = await context.supabase
      .from("church_members")
      .select("id")
      .eq("church_id", data.churchId)
      .eq("user_id", context.userId)
      .eq("status", "approved")
      .maybeSingle();
    const status = trusted ? "approved" : "pending";

    const { error } = await context.supabase.from("church_posts").insert({
      church_id: data.churchId,
      post_type: data.kind,
      post_id: data.postId,
      requested_by: context.userId,
      status,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);

    if (status === "pending") {
      const { data: church } = await context.supabase
        .from("churches")
        .select("owner_id, name")
        .eq("id", data.churchId)
        .maybeSingle();
      if (church) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("notifications").insert({
          user_id: church.owner_id,
          kind: "church_request",
          title: "A neighbor wants to list a post at your church",
          body: `Open your church board to approve or decline it.`,
          link: `/church-board/${data.churchId}`,
        });
      }
    }
    return { ok: true, status };
  });

/** The requests waiting on a church owner. */
export const listChurchRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ churchId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<ChurchPostDTO[]> => {
    const { data: church } = await context.supabase
      .from("churches")
      .select("owner_id")
      .eq("id", data.churchId)
      .maybeSingle();
    if (!church || church.owner_id !== context.userId) return [];

    const { data: links } = await context.supabase
      .from("church_posts")
      .select("id, post_type, post_id, requested_by")
      .eq("church_id", data.churchId)
      .eq("status", "pending");
    if (!links || links.length === 0) return [];

    const ministryIds = links.filter((l) => l.post_type === "ministry").map((l) => l.post_id);
    const needIds = links.filter((l) => l.post_type === "need").map((l) => l.post_id);
    const [{ data: ministries }, { data: needs }, { data: profiles }] = await Promise.all([
      ministryIds.length
        ? context.supabase
            .from("user_ministries")
            .select("id, short_title, description, city, zip")
            .in("id", ministryIds)
        : Promise.resolve({ data: [] as never[] }),
      needIds.length
        ? context.supabase
            .from("user_needs")
            .select("id, short_title, description, city, zip")
            .in("id", needIds)
            .eq("status", "active")
        : Promise.resolve({ data: [] as never[] }),
      context.supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", [...new Set(links.map((l) => l.requested_by))]),
    ]);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

    type Row = {
      id: string;
      short_title: string;
      description: string;
      city: string;
      zip: string | null;
    };
    const byId = new Map<string, Row>();
    for (const r of [...((ministries ?? []) as Row[]), ...((needs ?? []) as Row[])]) {
      byId.set(r.id, r);
    }

    return links.flatMap((l) => {
      const row = byId.get(l.post_id);
      if (!row) return [];
      return [
        {
          linkId: l.id,
          kind: l.post_type as "ministry" | "need",
          postId: l.post_id,
          title: row.short_title,
          description: row.description,
          city: row.city,
          zip: row.zip ?? "",
          status: "pending",
          posterName: nameById.get(l.requested_by) || "A neighbor",
        },
      ];
    });
  });

export const setChurchPostStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ linkId: z.string().uuid(), status: z.enum(["approved", "declined"]) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: link } = await context.supabase
      .from("church_posts")
      .select("id, church_id, requested_by")
      .eq("id", data.linkId)
      .maybeSingle();
    if (!link) throw new Error("That request is no longer there.");

    const { data: church } = await context.supabase
      .from("churches")
      .select("owner_id, name")
      .eq("id", link.church_id)
      .maybeSingle();
    if (!church || church.owner_id !== context.userId) {
      throw new Error("Only the church can do that.");
    }

    const { error } = await context.supabase
      .from("church_posts")
      .update({ status: data.status })
      .eq("id", data.linkId);
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("notifications").insert({
      user_id: link.requested_by,
      kind: "church_post",
      title:
        data.status === "approved"
          ? `Your post is listed at ${church.name}`
          : `${church.name} did not list your post`,
      body:
        data.status === "approved"
          ? "Visitors to their church page can see it now."
          : "You can still share it on the map.",
      link: `/church/${link.church_id}`,
    });
    return { ok: true };
  });

export type ChurchMemberDTO = {
  id: string;
  userId: string;
  name: string;
  photoUrl: string | null;
  createdAt: string;
  role: "member" | "moderator";
};

async function assertChurchOwner(
  context: { supabase: any; userId: string },
  churchId: string,
): Promise<{ owner_id: string; name: string }> {
  const { data: church } = await context.supabase
    .from("churches")
    .select("owner_id, name")
    .eq("id", churchId)
    .maybeSingle();
  if (!church || church.owner_id !== context.userId) {
    throw new Error("Only the church can open this page.");
  }
  return church;
}

/** Everything on a church's board: what is waiting and what is already listed. */
export const listChurchBoard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ churchId: z.string().uuid() }).parse(data))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ churchName: string; pending: ChurchPostDTO[]; approved: ChurchPostDTO[] }> => {
      const church = await assertChurchOwner(context, data.churchId);

      const { data: links } = await context.supabase
        .from("church_posts")
        .select("id, post_type, post_id, requested_by, status")
        .eq("church_id", data.churchId)
        .in("status", ["pending", "approved"])
        .order("created_at", { ascending: false });

      const rows = links ?? [];
      if (rows.length === 0) return { churchName: church.name, pending: [], approved: [] };

      const ministryIds = rows.filter((l: any) => l.post_type === "ministry").map((l: any) => l.post_id);
      const needIds = rows.filter((l: any) => l.post_type === "need").map((l: any) => l.post_id);
      const [{ data: ministries }, { data: needs }, { data: profiles }] = await Promise.all([
        ministryIds.length
          ? context.supabase
              .from("user_ministries")
              .select("id, short_title, description, city, zip")
              .in("id", ministryIds)
          : Promise.resolve({ data: [] as never[] }),
        needIds.length
          ? context.supabase
              .from("user_needs")
              .select("id, short_title, description, city, zip")
              .in("id", needIds)
              .eq("status", "active")
          : Promise.resolve({ data: [] as never[] }),
        context.supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", [...new Set(rows.map((l: any) => l.requested_by))]),
      ]);
      const nameById = new Map((profiles ?? []).map((p: any) => [p.id, p.display_name]));
      const byId = new Map<string, any>();
      for (const r of [...((ministries ?? []) as any[]), ...((needs ?? []) as any[])]) {
        byId.set(r.id, r);
      }

      const toDTO = (l: any): ChurchPostDTO[] => {
        const row = byId.get(l.post_id);
        if (!row) return [];
        return [
          {
            linkId: l.id,
            kind: l.post_type,
            postId: l.post_id,
            title: row.short_title,
            description: row.description,
            city: row.city ?? "",
            zip: row.zip ?? "",
            status: l.status,
            posterName: nameById.get(l.requested_by) || "A neighbor",
          },
        ];
      };

      return {
        churchName: church.name,
        pending: rows.filter((l: any) => l.status === "pending").flatMap(toDTO),
        approved: rows.filter((l: any) => l.status === "approved").flatMap(toDTO),
      };
    },
  );

/** The people this church lets post without approval, or those still waiting. */
export const listChurchMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        churchId: z.string().uuid(),
        status: z.enum(["approved", "pending"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<ChurchMemberDTO[]> => {
    await assertChurchOwner(context, data.churchId);
    const { data: rows } = await context.supabase
      .from("church_members")
      .select("id, user_id, role, created_at")
      .eq("church_id", data.churchId)
      .eq("status", data.status ?? "approved")
      .order("created_at", { ascending: false });
    if (!rows || rows.length === 0) return [];

    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", rows.map((r: any) => r.user_id));
    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const urlByPath = await signPaths(
      (profiles ?? [])
        .map((p: any) => p.avatar_url)
        .filter((p: any): p is string => Boolean(p) && !String(p).startsWith("http")),
    );

    return rows.map((r: any) => {
      const p = byId.get(r.user_id);
      const raw = p?.avatar_url ?? null;
      return {
        id: r.id,
        userId: r.user_id,
        name: p?.display_name || "A neighbor",
        photoUrl: raw ? (raw.startsWith("http") ? raw : (urlByPath.get(raw) ?? null)) : null,
        createdAt: r.created_at,
        role: r.role === "moderator" ? "moderator" : "member",
      };
    });
  });

/** Always allow this person to post at the church; optionally approve the request they just sent. */
export const addChurchMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ churchId: z.string().uuid(), userId: z.string().uuid().optional(), linkId: z.string().uuid().optional() })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const church = await assertChurchOwner(context, data.churchId);

    let memberId = data.userId ?? null;
    if (data.linkId) {
      const { data: link } = await context.supabase
        .from("church_posts")
        .select("id, church_id, requested_by")
        .eq("id", data.linkId)
        .maybeSingle();
      if (!link || link.church_id !== data.churchId) throw new Error("That request is no longer there.");
      memberId = link.requested_by;
      await context.supabase
        .from("church_posts")
        .update({ status: "approved" })
        .eq("id", data.linkId);
    }
    if (!memberId) throw new Error("No one to add.");

    const { error } = await context.supabase.from("church_members").insert({
      church_id: data.churchId,
      user_id: memberId,
      added_by: context.userId,
      status: "approved",
    });
    if (error) {
      if (!error.message.includes("duplicate")) throw new Error(error.message);
      // They already asked to attend — approving turns that request into a welcome.
      await context.supabase
        .from("church_members")
        .update({ status: "approved" })
        .eq("church_id", data.churchId)
        .eq("user_id", memberId);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("notifications").insert({
      user_id: memberId,
      kind: "church_post",
      title: `${church.name} welcomed you to their board`,
      body: "Anything you post can be listed at their church right away.",
      link: `/church/${data.churchId}`,
    });
    return { ok: true };
  });

export const removeChurchMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ churchId: z.string().uuid(), memberId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertChurchOwner(context, data.churchId);
    const { error } = await context.supabase
      .from("church_members")
      .delete()
      .eq("id", data.memberId)
      .eq("church_id", data.churchId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** The church creator promotes a member to prayer moderator (or returns them to a member). */
export const setMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        churchId: z.string().uuid(),
        memberId: z.string().uuid(),
        role: z.enum(["member", "moderator"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const church = await assertChurchOwner(context, data.churchId);
    const { data: member } = await context.supabase
      .from("church_members")
      .update({ role: data.role })
      .eq("id", data.memberId)
      .eq("church_id", data.churchId)
      .select("user_id")
      .maybeSingle();
    if (!member) throw new Error("That member is not on this church anymore.");
    if (data.role === "moderator") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("notifications").insert({
        user_id: member.user_id,
        kind: "church_post",
        title: `${church.name} made you a prayer moderator`,
        body: "You can approve, hide and remove prayers on the church wall.",
        link: `/church/${data.churchId}`,
      });
    }
    return { ok: true };
  });

/** The churches this member owns. */
export const listMyChurches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChurchDTO[]> => {
    const { data } = await context.supabase
      .from("churches")
      .select(CHURCH_COLUMNS)
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as ChurchRow[];
    const urlByPath = await signPaths(
      rows.map((r) => r.avatar_url).filter((p): p is string => Boolean(p)),
    );
    return rows.map((r) => toChurch(r, urlByPath));
  });

/** A neighbor asks to be counted as part of this church. */
export const requestChurchMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ churchId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true; status: "pending" | "approved" }> => {
    const { data: existing } = await context.supabase
      .from("church_members")
      .select("id, status")
      .eq("church_id", data.churchId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) return { ok: true, status: existing.status === "approved" ? "approved" : "pending" };

    const { error } = await context.supabase.from("church_members").insert({
      church_id: data.churchId,
      user_id: context.userId,
      added_by: null,
      status: "pending",
    });
    if (error) throw new Error(error.message);

    const { data: church } = await context.supabase
      .from("churches")
      .select("owner_id, name")
      .eq("id", data.churchId)
      .maybeSingle();
    if (church) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("notifications").insert({
        user_id: church.owner_id,
        kind: "church_post",
        title: "Someone asked to join your church",
        body: `A neighbor wants to be listed as part of ${church.name}.`,
        link: `/church-board/${data.churchId}`,
      });
    }
    return { ok: true, status: "pending" };
  });

/** Where this person stands with a church: none, waiting, or in. */
export const myChurchMembershipStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ churchId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<{ status: "none" | "pending" | "approved" }> => {
    const { data: row } = await context.supabase
      .from("church_members")
      .select("status")
      .eq("church_id", data.churchId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!row) return { status: "none" };
    return { status: row.status === "approved" ? "approved" : "pending" };
  });

/** The churches this person attends, for their profile scan codes. */
export const listChurchesIAttend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChurchDTO[]> => {
    const { data: memberships } = await context.supabase
      .from("church_members")
      .select("church_id")
      .eq("user_id", context.userId)
      .eq("status", "approved");
    const ids = (memberships ?? []).map((m) => m.church_id);
    if (ids.length === 0) return [];

    const { data } = await publicClient()
      .from("churches")
      .select(CHURCH_COLUMNS)
      .in("id", ids);
    const rows = (data ?? []) as ChurchRow[];
    const urlByPath = await signPaths(
      rows.map((r) => r.avatar_url).filter((p): p is string => Boolean(p)),
    );
    return rows.map((r) => toChurch(r, urlByPath));
  });

/** Someone takes a church off their own profile. */
export const leaveChurch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ churchId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("church_members")
      .delete()
      .eq("church_id", data.churchId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** The church owner says yes or no to someone who asked to attend. */
export const decideChurchMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        churchId: z.string().uuid(),
        memberId: z.string().uuid(),
        decision: z.enum(["approved", "declined"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const church = await assertChurchOwner(context, data.churchId);
    const { data: row } = await context.supabase
      .from("church_members")
      .select("id, user_id")
      .eq("id", data.memberId)
      .eq("church_id", data.churchId)
      .maybeSingle();
    if (!row) throw new Error("That request is no longer there.");

    if (data.decision === "declined") {
      const { error } = await context.supabase
        .from("church_members")
        .delete()
        .eq("id", data.memberId)
        .eq("church_id", data.churchId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    const { error } = await context.supabase
      .from("church_members")
      .update({ status: "approved" })
      .eq("id", data.memberId)
      .eq("church_id", data.churchId);
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("notifications").insert({
      user_id: row.user_id,
      kind: "church_post",
      title: `${church.name} welcomed you`,
      body: "Their scan code is now on your profile so you can share their page.",
      link: "/profile?tab=qr",
    });
    return { ok: true };
  });
