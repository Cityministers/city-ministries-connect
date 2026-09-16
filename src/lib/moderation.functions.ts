import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReportTarget = {
  type: "need" | "ministry";
  id: string;
  label: string;
};

export type ReportStatus = "new" | "reviewing" | "resolved" | "dismissed";

export type TrackedReport = {
  trackingCode: string;
  reason: string;
  status: ReportStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminReportDTO = TrackedReport & {
  id: string;
  details: string;
  reporterEmail: string;
  targetType: "need" | "ministry" | "other";
  targetId: string | null;
  targetLabel: string;
};

export type AdminNeedDTO = {
  id: string;
  shortTitle: string;
  title: string;
  description: string;
  city: string;
  zip: string;
  status: "active" | "hidden" | "removed";
  posterName: string;
  createdAt: string;
  reportCount: number;
};

function makeTrackingCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `CM-${code}`;
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("You do not have access to this page.");
}

/** Public list of things a visitor can report. */
export const listReportTargets = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReportTarget[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const out: ReportTarget[] = [];

    const { data: needs } = await supabaseAdmin
      .from("user_needs")
      .select("id, short_title, city")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(100);
    for (const n of needs ?? []) {
      out.push({ type: "need", id: n.id, label: `Need — ${n.short_title}${n.city ? ` (${n.city})` : ""}` });
    }

    const { data: mins } = await supabaseAdmin
      .from("user_ministries")
      .select("id, short_title, city")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(100);
    for (const m of mins ?? []) {
      out.push({
        type: "ministry",
        id: m.id,
        label: `Ministry — ${m.short_title}${m.city ? ` (${m.city})` : ""}`,
      });
    }

    return out;
  },
);

const submitInput = z.object({
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().min(10).max(2000),
  email: z.string().trim().max(160).optional().default(""),
  targetType: z.enum(["need", "ministry", "other"]).default("other"),
  targetId: z.string().uuid().optional().nullable(),
});

/** Anyone — signed in or not — can file a report. */
export const submitAbuseReport = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitInput.parse(data))
  .handler(async ({ data }): Promise<{ trackingCode: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const trackingCode = makeTrackingCode();

    const { error } = await supabaseAdmin.from("abuse_reports").insert({
      tracking_code: trackingCode,
      reporter_email: data.email,
      reason: data.reason,
      details: data.details,
      target_type: data.targetType,
      target_id: data.targetId ?? null,
    });
    if (error) throw new Error(error.message);

    // Reported posts are hidden from public view straight away, pending review.
    if (data.targetId && data.targetType !== "other") {
      const table = data.targetType === "need" ? "user_needs" : "user_ministries";
      await supabaseAdmin.from(table).update({ status: "hidden" }).eq("id", data.targetId);
    }

    return { trackingCode };
  });

export const trackAbuseReport = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ code: z.string().trim().min(4).max(20) }).parse(data))
  .handler(async ({ data }): Promise<TrackedReport | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("abuse_reports")
      .select("tracking_code, reason, status, admin_notes, created_at, updated_at")
      .eq("tracking_code", data.code.trim().toUpperCase())
      .maybeSingle();
    if (!row) return null;
    return {
      trackingCode: row.tracking_code,
      reason: row.reason,
      status: row.status as ReportStatus,
      adminNotes: row.admin_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<boolean> => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return Boolean(data);
  });

export const adminListNeeds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminNeedDTO[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: needs } = await supabaseAdmin
      .from("user_needs")
      .select("id, owner_id, short_title, title, description, city, zip, status, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (!needs) return [];

    const ownerIds = [...new Set(needs.map((n) => n.owner_id))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name")
      .in("id", ownerIds);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

    const { data: reports } = await supabaseAdmin
      .from("abuse_reports")
      .select("target_id")
      .eq("target_type", "need");
    const counts = new Map<string, number>();
    for (const r of reports ?? []) {
      if (r.target_id) counts.set(r.target_id, (counts.get(r.target_id) ?? 0) + 1);
    }

    return needs.map((n) => ({
      id: n.id,
      shortTitle: n.short_title,
      title: n.title || n.short_title,
      description: n.description,
      city: n.city ?? "",
      zip: n.zip ?? "",
      status: (n.status ?? "active") as AdminNeedDTO["status"],
      posterName: nameById.get(n.owner_id) || "A neighbor",
      createdAt: n.created_at,
      reportCount: counts.get(n.id) ?? 0,
    }));
  });

export const adminSetNeedStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["active", "hidden", "removed"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_needs")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminReportDTO[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("abuse_reports")
      .select(
        "id, tracking_code, reason, details, reporter_email, target_type, target_id, status, admin_notes, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (!rows) return [];

    const needIds = rows.filter((r) => r.target_type === "need" && r.target_id).map((r) => r.target_id!);
    const minIds = rows
      .filter((r) => r.target_type === "ministry" && r.target_id)
      .map((r) => r.target_id!);
    const labels = new Map<string, string>();
    if (needIds.length) {
      const { data } = await supabaseAdmin.from("user_needs").select("id, short_title").in("id", needIds);
      for (const r of data ?? []) labels.set(r.id, `Need — ${r.short_title}`);
    }
    if (minIds.length) {
      const { data } = await supabaseAdmin
        .from("user_ministries")
        .select("id, short_title")
        .in("id", minIds);
      for (const r of data ?? []) labels.set(r.id, `Ministry — ${r.short_title}`);
    }

    return rows.map((r) => ({
      id: r.id,
      trackingCode: r.tracking_code,
      reason: r.reason,
      details: r.details,
      reporterEmail: r.reporter_email,
      targetType: r.target_type as AdminReportDTO["targetType"],
      targetId: r.target_id,
      targetLabel: r.target_id ? (labels.get(r.target_id) ?? "Removed item") : "Not linked to a post",
      status: r.status as ReportStatus,
      adminNotes: r.admin_notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  });

export const adminUpdateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "reviewing", "resolved", "dismissed"]),
        adminNotes: z.string().trim().max(1000).optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("abuse_reports")
      .update({ status: data.status, admin_notes: data.adminNotes })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AdminFeedbackDTO = {
  id: string;
  overall: number;
  ease: number | null;
  design: number | null;
  speed: number | null;
  likes: string;
  changes: string;
  additions: string;
  email: string;
  createdAt: string;
};

export const adminListFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminFeedbackDTO[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("app_feedback")
      .select(
        "id, overall_rating, ease_rating, design_rating, speed_rating, likes, changes, additions, email, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      overall: r.overall_rating ?? 0,
      ease: r.ease_rating,
      design: r.design_rating,
      speed: r.speed_rating,
      likes: r.likes ?? "",
      changes: r.changes ?? "",
      additions: r.additions ?? "",
      email: r.email ?? "",
      createdAt: r.created_at,
    }));
  });
