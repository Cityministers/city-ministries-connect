import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type MyProfileDTO = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
};

/** Member identity for an authenticated visitor; never includes private contact details. */
export const getMemberProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("display_name, avatar_url, bio, city")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) return null;

    let avatarUrl: string | null = null;
    if (profile.avatar_url) {
      const { data: signed } = await context.supabase.storage
        .from("ministry-avatars")
        .createSignedUrl(profile.avatar_url, 60 * 60 * 24 * 7);
      avatarUrl = signed?.signedUrl ?? null;
    }
    return {
      displayName: profile.display_name || "A neighbor",
      avatarUrl,
      bio: profile.bio,
      city: profile.city,
    };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyProfileDTO> => {
    const { data } = await context.supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", context.userId)
      .maybeSingle();

    let avatarUrl: string | null = null;
    if (data?.avatar_url) {
      const { data: signed } = await context.supabase.storage
        .from("ministry-avatars")
        .createSignedUrl(data.avatar_url, 60 * 60 * 24 * 7);
      avatarUrl = signed?.signedUrl ?? null;
    }

    return {
      displayName: data?.display_name ?? "",
      email: (context.claims?.["email"] as string | undefined) ?? "",
      avatarUrl,
    };
  });

/** The city and ZIP saved on the profile, used as the "home" distances are measured from. */
export const getMyPlace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ city: string; zip: string }> => {
    const { data } = await context.supabase
      .from("profiles")
      .select("city, zip")
      .eq("id", context.userId)
      .maybeSingle();
    return { city: data?.city ?? "", zip: data?.zip ?? "" };
  });

const updateInput = z.object({
  displayName: z.string().trim().max(60).optional(),
  avatarPath: z.string().trim().max(300).optional(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateInput.parse(data))
  .handler(async ({ data, context }) => {
    const patch: ProfileUpdate = {};
    if (data.displayName !== undefined) patch["display_name"] = data.displayName;
    if (data.avatarPath !== undefined) patch["avatar_url"] = data.avatarPath;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const onboardingInput = z.object({
  displayName: z.string().trim().min(1).max(60),
  city: z.string().trim().max(80).default(""),
  zip: z.string().trim().max(12).default(""),
  avatarPath: z.string().trim().max(300).optional(),
});

/** Whether the signed-in member has finished the first-time setup step. */
export const getOnboardingState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ onboarded: boolean }> => {
    const { data } = await context.supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", context.userId)
      .maybeSingle();
    return { onboarded: Boolean(data?.onboarded_at) };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => onboardingInput.parse(data))
  .handler(async ({ data, context }) => {
    const patch: ProfileUpdate & { id: string } = {
      id: context.userId,
      display_name: data.displayName,
      city: data.city,
      zip: data.zip,
      onboarded_at: new Date().toISOString(),
    };
    if (data.avatarPath) patch["avatar_url"] = data.avatarPath;

    // Upsert: a member row may not exist yet for accounts created before the
    // signup trigger, and an update on a missing row would silently do nothing.
    const { data: saved, error } = await context.supabase
      .from("profiles")
      .upsert(patch, { onConflict: "id" })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!saved) throw new Error("We couldn't save your details. Please try again.");
    return { ok: true };
  });


export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;

    // Remove the user's content rows first (owner-scoped via RLS).
    await context.supabase.from("user_ministries").delete().eq("owner_id", uid);
    await context.supabase.from("user_needs").delete().eq("owner_id", uid);
    await context.supabase.from("shape_suggestions").delete().eq("owner_id", uid);
    await context.supabase.from("favorites").delete().eq("user_id", uid);
    await context.supabase.from("post_reactions").delete().eq("user_id", uid);
    await context.supabase.from("post_comments").delete().eq("user_id", uid);
    await context.supabase.from("notifications").delete().eq("user_id", uid);
    await context.supabase.from("messages").delete().eq("sender_id", uid);
    await context.supabase.from("conversation_participants").delete().eq("user_id", uid);
    await context.supabase.from("shape_profiles").delete().eq("owner_id", uid);
    await context.supabase.from("profiles").delete().eq("id", uid);

    // Best-effort cleanup of uploaded photos.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: files } = await supabaseAdmin.storage
      .from("ministry-avatars")
      .list(uid, { limit: 200 });
    if (files && files.length > 0) {
      await supabaseAdmin.storage
        .from("ministry-avatars")
        .remove(files.map((f) => `${uid}/${f.name}`));
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type MemberPostItem = {
  id: string;
  kind: "ministry" | "need" | "prayer";
  title: string;
  createdAt: string;
  met?: boolean;
  churchId?: string | null;
};

/** Public post history for a member, respecting their privacy switches and anonymity. */
export const getMemberPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: p } = await sb
      .from("profiles")
      .select("show_ministries, show_needs, show_prayers")
      .eq("id", data.id)
      .maybeSingle();
    const empty = { ministries: [] as MemberPostItem[], needs: [] as MemberPostItem[], prayers: [] as MemberPostItem[] };
    if (!p) return empty;
    if (p.show_ministries) {
      const { data: rows } = await sb.from("user_ministries").select("id, short_title, created_at")
        .eq("owner_id", data.id).eq("status", "active").order("created_at", { ascending: false }).limit(30);
      empty.ministries = (rows ?? []).map((r) => ({ id: r.id, kind: "ministry", title: r.short_title, createdAt: r.created_at }));
    }
    if (p.show_needs) {
      const { data: rows } = await sb.from("user_needs").select("id, short_title, created_at, status")
        .eq("owner_id", data.id).in("status", ["active", "met"]).order("created_at", { ascending: false }).limit(30);
      empty.needs = (rows ?? []).map((r) => ({ id: r.id, kind: "need", title: r.short_title, createdAt: r.created_at, met: r.status === "met" }));
    }
    if (p.show_prayers) {
      const { data: rows } = await sb.from("prayers").select("id, short_title, created_at, church_id")
        .eq("owner_id", data.id).eq("anonymous", false).in("status", ["active", "approved"])
        .order("created_at", { ascending: false }).limit(30);
      empty.prayers = (rows ?? []).map((r) => ({ id: r.id, kind: "prayer", title: r.short_title, createdAt: r.created_at, churchId: r.church_id }));
    }
    return empty;
  });

export const getMyPrivacy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("profiles")
      .select("show_ministries, show_needs, show_prayers").eq("id", context.userId).maybeSingle();
    return {
      showMinistries: data?.show_ministries ?? true,
      showNeeds: data?.show_needs ?? true,
      showPrayers: data?.show_prayers ?? true,
    };
  });

export const updateMyPrivacy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ field: z.enum(["show_ministries", "show_needs", "show_prayers"]), value: z.boolean() }).parse(data))
  .handler(async ({ data, context }) => {
    const patch: ProfileUpdate = { [data.field]: data.value };
    const { error } = await context.supabase.from("profiles").update(patch).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
