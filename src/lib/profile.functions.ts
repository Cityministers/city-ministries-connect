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
    const patch: ProfileUpdate = {
      display_name: data.displayName,
      city: data.city,
      zip: data.zip,
      onboarded_at: new Date().toISOString(),
    };
    if (data.avatarPath) patch["avatar_url"] = data.avatarPath;

    const { error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
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
