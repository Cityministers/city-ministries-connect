import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BIBLICAL_GIFTS, SPIRITUAL_GIFTS } from "@/data/shape";

export type GiftReference = {
  id: string;
  contactName: string;
  code: string;
  gifts: string[];
  note: string;
  respondedAt: string | null;
};

const ALLOWED = new Set<string>([...BIBLICAL_GIFTS, ...SPIRITUAL_GIFTS]);

function mapRow(row: {
  id: string;
  contact_name: string;
  code: string;
  gifts: unknown;
  note: string;
  responded_at: string | null;
}): GiftReference {
  return {
    id: row.id,
    contactName: row.contact_name,
    code: row.code,
    gifts: Array.isArray(row.gifts)
      ? (row.gifts as unknown[]).filter(
          (g): g is string => typeof g === "string" && ALLOWED.has(g),
        )
      : [],
    note: row.note,
    respondedAt: row.responded_at,
  };
}

export const createGiftReference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ contactName: z.string().trim().min(1).max(60) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("gift_references")
      .insert({ owner_id: context.userId, contact_name: data.contactName })
      .select("id, contact_name, code, gifts, note, responded_at")
      .single();
    if (error) throw new Error(error.message);
    return { reference: mapRow(row) };
  });

export const listGiftReferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("gift_references")
      .select("id, contact_name, code, gifts, note, responded_at")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { references: (data ?? []).map(mapRow) };
  });

export const deleteGiftReference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("gift_references")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const codeSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{32}$/, "invalid code");

export const getGiftReference = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ code: codeSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("gift_references")
      .select("contact_name, responded_at, owner_id")
      .eq("code", data.code)
      .maybeSingle();
    if (!row) return { found: false as const };

    const { data: shape } = await supabaseAdmin
      .from("shape_profiles")
      .select("answers")
      .eq("owner_id", row.owner_id)
      .maybeSingle();
    const answers = (shape?.answers ?? {}) as { firstName?: string };
    let firstName = (answers.firstName ?? "").trim();
    if (!firstName) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("display_name")
        .eq("id", row.owner_id)
        .maybeSingle();
      firstName = (profile?.display_name ?? "").trim().split(/\s+/)[0] ?? "";
    }
    if (!firstName) firstName = "your friend";

    // Where they'd serve, so we can suggest ministries in their area.
    const place = (shape?.answers ?? {}) as { city?: string; zip?: string };
    let city = (place.city ?? "").trim();
    let zip = (place.zip ?? "").trim();
    if (!city && !zip) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("city, zip")
        .eq("id", row.owner_id)
        .maybeSingle();
      city = (profile?.city ?? "").trim();
      zip = (profile?.zip ?? "").trim();
    }

    const nearby: { title: string; city: string }[] = [];
    if (city || zip) {
      const { data: rows } = await supabaseAdmin
        .from("user_ministries")
        .select("short_title, city, zip")
        .eq("status", "active")
        .limit(200);
      for (const m of rows ?? []) {
        const sameCity =
          city.length > 1 && (m.city ?? "").trim().toLowerCase() === city.toLowerCase();
        const sameZip = zip.length > 3 && (m.zip ?? "").trim() === zip;
        if (sameCity || sameZip) nearby.push({ title: m.short_title, city: m.city ?? "" });
        if (nearby.length >= 6) break;
      }
    }

    return {
      found: true as const,
      contactName: row.contact_name,
      ownerFirstName: firstName,
      answered: row.responded_at !== null,
      city,
      zip,
      nearby,
    };
  });

export const submitGiftReference = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        code: codeSchema,
        gifts: z.array(z.string().max(60)).max(40),
        note: z.string().trim().max(600),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const gifts = data.gifts.filter((g) => ALLOWED.has(g));
    if (gifts.length === 0 && data.note.length === 0) {
      throw new Error("Pick at least one gift or write a short note.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("gift_references")
      .update({ gifts, note: data.note, responded_at: new Date().toISOString() })
      .eq("code", data.code)
      .is("responded_at", null)
      .select("id, owner_id, contact_name")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("This link was already answered or doesn't exist.");

    await supabaseAdmin.from("notifications").insert({
      user_id: row.owner_id,
      kind: "gift_reference",
      title: `${row.contact_name} answered about your gifts`,
      body:
        gifts.length > 0
          ? `They see: ${gifts.join(", ")}`
          : "They left you a note.",
      link: "/profile?tab=gifts",
    });

    return { ok: true };
  });
