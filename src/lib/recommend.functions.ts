import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { OPTION_SYNONYMS } from "@/data/shape";

export type PersonMatch = {
  id: string;
  name: string;
  avatarUrl: string | null;
  city: string;
  reason: string;
  score: number;
};

export type PostMatch = {
  id: string;
  kind: "ministry" | "need";
  title: string;
  description: string;
  city: string;
  zip: string;
  avatarUrl: string | null;
  reason: string;
  score: number;
};

type Answers = {
  city?: string;
  zip?: string;
  gifts?: string[];
  customGifts?: string[];
  heart?: string[];
  abilities?: string[];
  resources?: string[];
};

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function traits(a: Answers) {
  return {
    gifts: [...list(a.gifts), ...list(a.customGifts)],
    heart: list(a.heart),
    abilities: list(a.abilities),
    resources: list(a.resources),
  };
}

function overlap(mine: string[], theirs: string[]): string[] {
  const set = new Set(theirs.map((t) => t.toLowerCase()));
  return mine.filter((m) => set.has(m.toLowerCase()));
}

/** Words we look for in a post's wording for one of the user's answers. */
function keywords(option: string): string[] {
  const extra = OPTION_SYNONYMS[option] ?? [];
  const base = option
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3);
  return [...new Set([...base, ...extra.map((e) => e.toLowerCase())])];
}

function joinList(items: string[], max = 2): string {
  const shown = items.slice(0, max);
  if (shown.length === 0) return "";
  if (shown.length === 1) return shown[0]!;
  return `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}`;
}

export const recommendConnections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ people: PersonMatch[]; posts: PostMatch[] }> => {
    const { supabase, userId } = context;

    const { data: mineRow } = await supabase
      .from("shape_profiles")
      .select("city, zip, answers")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!mineRow) return { people: [], posts: [] };

    const mineAnswers = (mineRow.answers ?? {}) as Answers;
    const mine = traits(mineAnswers);
    const myCity = (mineRow.city ?? "").trim().toLowerCase();
    const myZip = (mineRow.zip ?? "").trim();

    // ---- People you should meet -------------------------------------------
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: others } = await supabaseAdmin
      .from("shape_profiles")
      .select("owner_id, city, zip, answers")
      .neq("owner_id", userId)
      .limit(300);

    const candidates = others ?? [];
    const ownerIds = [...new Set(candidates.map((c) => c.owner_id))];
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, city")
      .in("id", ownerIds.length > 0 ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);
    const profileById = new Map((profileRows ?? []).map((p) => [p.id, p]));

    const people: PersonMatch[] = [];
    for (const row of candidates) {
      const theirs = traits((row.answers ?? {}) as Answers);
      const sharedGifts = overlap(mine.gifts, theirs.gifts);
      const sharedHeart = overlap(mine.heart, theirs.heart);
      const sharedAbilities = overlap(mine.abilities, theirs.abilities);
      const sharedResources = overlap(mine.resources, theirs.resources);
      const theirCity = (row.city ?? "").trim().toLowerCase();
      const theirZip = (row.zip ?? "").trim();
      const samePlace = (myZip.length > 0 && myZip === theirZip) || (myCity.length > 0 && myCity === theirCity);

      const score =
        sharedGifts.length * 3 +
        sharedHeart.length * 3 +
        sharedAbilities.length * 2 +
        sharedResources.length +
        (samePlace ? 4 : 0);
      if (score < 4) continue;

      const profile = profileById.get(row.owner_id);
      const bits: string[] = [];
      if (sharedGifts.length > 0) bits.push(`the same gifts (${joinList(sharedGifts)})`);
      if (sharedHeart.length > 0) bits.push(`a heart for ${joinList(sharedHeart)}`);
      if (sharedAbilities.length > 0 && bits.length < 2) bits.push(`skills in ${joinList(sharedAbilities)}`);
      const place = samePlace ? ` You're both in ${row.city || profile?.city || "the same area"}.` : "";

      people.push({
        id: row.owner_id,
        name: profile?.display_name || "A neighbor",
        avatarUrl: profile?.avatar_url ?? null,
        city: row.city || profile?.city || "",
        reason: `You share ${joinList(bits, 2) || "a similar calling"}.${place}`,
        score,
      });
    }
    people.sort((a, b) => b.score - a.score);

    // ---- Posts you should view --------------------------------------------
    const [{ data: ministryRows }, { data: needRows }] = await Promise.all([
      supabase
        .from("user_ministries")
        .select("id, owner_id, short_title, title, description, city, zip, avatar_url")
        .eq("status", "active")
        .neq("owner_id", userId)
        .order("updated_at", { ascending: false })
        .limit(150),
      supabase
        .from("user_needs")
        .select("id, owner_id, short_title, title, description, city, zip, avatar_url")
        .eq("status", "active")
        .neq("owner_id", userId)
        .order("updated_at", { ascending: false })
        .limit(150),
    ]);

    const myOptions = [
      ...mine.gifts.map((o) => ({ option: o, weight: 3 })),
      ...mine.heart.map((o) => ({ option: o, weight: 3 })),
      ...mine.abilities.map((o) => ({ option: o, weight: 2 })),
      ...mine.resources.map((o) => ({ option: o, weight: 1 })),
    ];

    const posts: PostMatch[] = [];
    const scorePost = (
      row: {
        id: string;
        short_title: string;
        title: string | null;
        description: string;
        city: string;
        zip: string;
        avatar_url: string | null;
      },
      kind: "ministry" | "need",
    ) => {
      const text = `${row.short_title} ${row.title ?? ""} ${row.description}`.toLowerCase();
      const matched: string[] = [];
      let score = 0;
      for (const { option, weight } of myOptions) {
        if (keywords(option).some((k) => text.includes(k))) {
          score += weight;
          matched.push(option);
        }
      }
      const samePlace =
        (myZip.length > 0 && myZip === (row.zip ?? "").trim()) ||
        (myCity.length > 0 && myCity === (row.city ?? "").trim().toLowerCase());
      if (samePlace) score += 3;
      if (score < 4) return;
      const placeBit = samePlace ? ` It's in ${row.city}.` : "";
      posts.push({
        id: row.id,
        kind,
        title: row.title || row.short_title,
        description: row.description,
        city: row.city,
        zip: row.zip,
        avatarUrl: row.avatar_url,
        reason:
          matched.length > 0
            ? `Matches your ${joinList(matched, 2)}.${placeBit}`
            : `Close to you.${placeBit}`,
        score,
      });
    };

    for (const row of ministryRows ?? []) scorePost(row, "ministry");
    for (const row of needRows ?? []) scorePost(row, "need");
    posts.sort((a, b) => b.score - a.score);

    return { people: people.slice(0, 8), posts: posts.slice(0, 8) };
  });
