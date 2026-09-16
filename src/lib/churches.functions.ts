import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type ChurchDTO = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  iconId: string;
  photoUrl: string | null;
  address: string;
  city: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  serviceTimes: string;
  phone: string;
  website: string;
  status: string;
  planStatus: string;
  currentPeriodEnd: string | null;
};

export type ChurchPostDTO = {
  linkId: string;
  kind: "ministry" | "need";
  postId: string;
  title: string;
  description: string;
  city: string;
  zip: string;
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
  lat: number | null;
  lng: number | null;
  service_times: string;
  phone: string;
  website: string;
  status: string;
  plan_status: string;
  current_period_end: string | null;
};

const CHURCH_COLUMNS =
  "id, owner_id, name, description, icon_id, avatar_url, address, city, zip, lat, lng, service_times, phone, website, status, plan_status, current_period_end";

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
    address: row.address,
    city: row.city,
    zip: row.zip,
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

/** Puts churches that were never geocoded onto the map, same as ministry posts. */
async function placeChurches(rows: ChurchRow[]) {
  const unplaced = rows.filter((r) => r.lat == null || r.lng == null);
  if (unplaced.length === 0) return;
  const { geocodePlaces, placeKey } = await import("./geocode.server");
  const found = await geocodePlaces(unplaced.map((r) => ({ city: r.city, zip: r.zip })));
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  for (const r of unplaced) {
    const point = found.get(placeKey(r.city, r.zip));
    if (!point) continue;
    r.lat = point.lat;
    r.lng = point.lng;
    await supabaseAdmin
      .from("churches")
      .update({ lat: point.lat, lng: point.lng })
      .eq("id", r.id);
  }
}

/** Active churches for the map. */
export const listChurches = createServerFn({ method: "GET" }).handler(
  async (): Promise<ChurchDTO[]> => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("churches")
      .select(CHURCH_COLUMNS)
      .eq("status", "active")
      .limit(200);
    if (error || !data) return [];
    const rows = data as ChurchRow[];
    await placeChurches(rows);
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
      const urlByPath = await signPaths(church.avatar_url ? [church.avatar_url] : []);

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
          : Promise.resolve({ data: [] as never[] }),
      ]);

      // Public posts in the same place that aren't attached to any church.
      const place = church.zip || church.city;
      const column = church.zip ? "zip" : "city";
      const [{ data: nearMinistries }, { data: nearNeeds }, { data: takenLinks }] =
        await Promise.all([
          place
            ? supabase
                .from("user_ministries")
                .select("id, owner_id, short_title, title, description, city, zip")
                .eq(column, place)
                .limit(40)
            : Promise.resolve({ data: [] as never[] }),
          place
            ? supabase
                .from("user_needs")
                .select("id, owner_id, short_title, title, description, city, zip")
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

      const ownerIds = [
        ...new Set(
          [
            ...((ministries ?? []) as PostRow[]),
            ...((needs ?? []) as PostRow[]),
            ...((nearMinistries ?? []) as PostRow[]),
            ...((nearNeeds ?? []) as PostRow[]),
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

      const posts = [
        ...shape((ministries ?? []) as PostRow[], "ministry", true),
        ...shape((needs ?? []) as PostRow[], "need", true),
      ];
      const nearby = [
        ...shape((nearMinistries ?? []) as PostRow[], "ministry", false),
        ...shape((nearNeeds ?? []) as PostRow[], "need", false),
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
  iconId: z.enum(["chapel", "cross", "hall"]).optional().default("chapel"),
  avatarPath: z.string().trim().max(300).optional().default(""),
  address: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().min(2).max(80),
  zip: z.string().trim().max(10).optional().default(""),
  serviceTimes: z.string().trim().max(200).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  website: z.string().trim().max(200).optional().default(""),
});

export const createChurch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => churchInput.parse(data))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { data: existing } = await context.supabase
      .from("churches")
      .select("id")
      .ilike("name", data.name)
      .eq("zip", data.zip)
      .maybeSingle();
    if (existing) {
      throw new Error("A church with this name and ZIP code is already on the map.");
    }
    const { data: row, error } = await context.supabase
      .from("churches")
      .insert({
        owner_id: context.userId,
        name: data.name,
        description: data.description,
        icon_id: data.iconId,
        avatar_url: data.avatarPath || null,
        address: data.address,
        city: data.city,
        zip: data.zip,
        service_times: data.serviceTimes,
        phone: data.phone,
        website: data.website,
        status: "inactive",
        plan_status: "none",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateChurch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    churchInput.extend({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("churches")
      .update({
        name: data.name,
        description: data.description,
        icon_id: data.iconId,
        ...(data.avatarPath ? { avatar_url: data.avatarPath } : {}),
        address: data.address,
        city: data.city,
        zip: data.zip,
        service_times: data.serviceTimes,
        phone: data.phone,
        website: data.website,
        lat: null,
        lng: null,
      })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
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
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("church_posts").insert({
      church_id: data.churchId,
      post_type: data.kind,
      post_id: data.postId,
      requested_by: context.userId,
      status: "pending",
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);

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
        body: `Open your church page to approve or decline it.`,
        link: `/church/${data.churchId}`,
      });
    }
    return { ok: true };
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
    const { error } = await context.supabase
      .from("church_posts")
      .update({ status: data.status })
      .eq("id", data.linkId);
    if (error) throw new Error(error.message);
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
