import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminChurchPaymentDTO = {
  id: string;
  amountCents: number;
  status: string;
  isMock: boolean;
  createdAt: string;
};

export type AdminChurchDTO = {
  id: string;
  name: string;
  city: string;
  zip: string;
  address: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
  planStatus: string;
  currentPeriodEnd: string | null;
  onMap: boolean;
  located: boolean;
  createdAt: string;
  paidCents: number;
  payments: AdminChurchPaymentDTO[];
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("You do not have access to this page.");
}

export const adminListChurches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminChurchDTO[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("churches")
      .select(
        "id, owner_id, name, city, zip, address, lat, lng, status, plan_status, current_period_end, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return [];

    const ownerIds = [...new Set(rows.map((r) => r.owner_id))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name")
      .in("id", ownerIds);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? ""]));

    const emailById = new Map<string, string>();
    for (const uid of ownerIds) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(uid);
      if (u?.user?.email) emailById.set(uid, u.user.email);
    }

    const { data: payments } = await supabaseAdmin
      .from("church_payments")
      .select("id, church_id, amount_cents, status, is_mock, created_at")
      .in(
        "church_id",
        rows.map((r) => r.id),
      )
      .order("created_at", { ascending: false });

    const byChurch = new Map<string, AdminChurchPaymentDTO[]>();
    for (const p of payments ?? []) {
      const list = byChurch.get(p.church_id) ?? [];
      list.push({
        id: p.id,
        amountCents: p.amount_cents ?? 0,
        status: p.status ?? "paid",
        isMock: Boolean(p.is_mock),
        createdAt: p.created_at,
      });
      byChurch.set(p.church_id, list);
    }

    return rows.map((r) => {
      const list = byChurch.get(r.id) ?? [];
      return {
        id: r.id,
        name: r.name,
        city: r.city ?? "",
        zip: r.zip ?? "",
        address: r.address ?? "",
        ownerName: nameById.get(r.owner_id) || "A neighbor",
        ownerEmail: emailById.get(r.owner_id) ?? "",
        status: r.status ?? "inactive",
        planStatus: r.plan_status ?? "none",
        currentPeriodEnd: r.current_period_end,
        onMap: (r.status ?? "") === "active" && r.lat != null && r.lng != null,
        located: r.lat != null && r.lng != null,
        createdAt: r.created_at,
        paidCents: list
          .filter((p) => p.status === "paid")
          .reduce((sum, p) => sum + p.amountCents, 0),
        payments: list.slice(0, 6),
      };
    });
  });

/** Record months of payment for a church and keep it on the map until the period ends. */
export const adminRecordChurchPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        churchId: z.string().uuid(),
        months: z.number().int().min(1).max(24),
        amountCents: z.number().int().min(0).max(1000000).optional().default(4900),
      })
      .parse(data),
  )
  .handler(
    async ({ data, context }): Promise<{ ok: true; periodEnd: string }> => {
      await assertAdmin(context);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const { data: church } = await supabaseAdmin
        .from("churches")
        .select("id, current_period_end")
        .eq("id", data.churchId)
        .maybeSingle();
      if (!church) throw new Error("Church not found.");

      const now = new Date();
      const existing = church.current_period_end ? new Date(church.current_period_end) : null;
      const base = existing && existing > now ? existing : now;
      const periodEnd = new Date(base);
      periodEnd.setMonth(periodEnd.getMonth() + data.months);

      await supabaseAdmin.from("church_payments").insert({
        church_id: data.churchId,
        payer_id: context.userId,
        amount_cents: data.amountCents * data.months,
        status: "paid",
        is_mock: false,
      });

      const { error } = await supabaseAdmin
        .from("churches")
        .update({
          status: "active",
          plan_status: "active",
          current_period_end: periodEnd.toISOString(),
        })
        .eq("id", data.churchId);
      if (error) throw new Error(error.message);
      return { ok: true, periodEnd: periodEnd.toISOString() };
    },
  );

/** Put a church on the map or take it off (unpaid, or removed for a rule break). */
export const adminSetChurchStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        churchId: z.string().uuid(),
        status: z.enum(["active", "inactive"]),
        planStatus: z.enum(["active", "past_due", "none"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("churches")
      .update({
        status: data.status,
        plan_status: data.planStatus ?? (data.status === "active" ? "active" : "past_due"),
      })
      .eq("id", data.churchId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteChurch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ churchId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("church_posts").delete().eq("church_id", data.churchId);
    await supabaseAdmin.from("church_payments").delete().eq("church_id", data.churchId);
    const { error } = await supabaseAdmin.from("churches").delete().eq("id", data.churchId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
