import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listPendingRooms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("rooms")
      .select("id, slug, title, description, icon, created_by, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const moderateRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), action: z.enum(["approve", "decline"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Only admins can do this.");
    const status = data.action === "approve" ? "approved" : "declined";
    const { data: room, error } = await context.supabase
      .from("rooms").update({ status }).eq("id", data.id).select("slug, title, created_by").single();
    if (error) throw new Error(error.message);
    if (room.created_by) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("notifications").insert({
        user_id: room.created_by,
        kind: "room",
        title: status === "approved" ? `Your room "${room.title}" was approved` : `Your room "${room.title}" was declined`,
        body: status === "approved" ? "Anyone can now find and join it." : "",
        link: status === "approved" ? `/rooms/${room.slug}` : "/explore",
      });
    }
    return { ok: true };
  });
