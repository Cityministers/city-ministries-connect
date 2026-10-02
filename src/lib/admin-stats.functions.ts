import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type StatRow = {
  key: string;
  label: string;
  today: number;
  week: number;
  month: number;
  total: number;
};

export type RecentItem = {
  type: "ministry" | "need" | "prayer" | "room" | "church";
  title: string;
  author: string;
  at: string;
};

export type SiteStats = {
  stats: StatRow[];
  recent: RecentItem[];
};

export const getSiteStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Verify the caller is an admin before reading anything.
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("You do not have access to this page.");

    // The database function re-checks admin status on its own.
    const { data, error } = await context.supabase.rpc("get_site_activity_stats");
    if (error) throw new Error(error.message);
    return data as SiteStats;
  });
