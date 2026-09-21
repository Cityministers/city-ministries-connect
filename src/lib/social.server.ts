import type { Database } from "@/integrations/supabase/types";

export type PostKind = Database["public"]["Enums"]["post_kind"];

/** Looks up who owns a post and its short title, using privileged access. */
export async function getPostOwner(
  postType: PostKind,
  postId: string,
): Promise<{ ownerId: string; shortTitle: string } | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const table =
    postType === "need" ? "user_needs" : postType === "prayer" ? "prayers" : "user_ministries";
  const { data } = await supabaseAdmin
    .from(table)
    .select("owner_id, short_title")
    .eq("id", postId)
    .maybeSingle();
  if (!data) return null;
  return { ownerId: data.owner_id, shortTitle: data.short_title };
}

/** Creates a notification for another member. Never notifies the actor. */
export async function notifyUser(input: {
  userId: string;
  actorId: string;
  kind: string;
  title: string;
  body?: string;
  link?: string;
}) {
  if (!input.userId || input.userId === input.actorId) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("notifications").insert({
    user_id: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body ?? "",
    link: input.link ?? "",
  });
}

/** Members whose own posts sit in the same city or ZIP as a new need. */
export async function neighborsOf(city: string, zip: string): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ids = new Set<string>();
  const normalizedCity = city.trim().toLowerCase();

  for (const table of ["user_ministries", "user_needs"] as const) {
    const { data } = await supabaseAdmin
      .from(table)
      .select("owner_id, city, zip")
      .limit(500);
    for (const row of data ?? []) {
      const sameCity =
        normalizedCity.length > 1 && (row.city ?? "").trim().toLowerCase() === normalizedCity;
      const sameZip = zip.trim().length > 3 && (row.zip ?? "").trim() === zip.trim();
      if (sameCity || sameZip) ids.add(row.owner_id);
    }
  }
  return [...ids];
}

export async function displayNameOf(userId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.display_name || "A neighbor";
}
