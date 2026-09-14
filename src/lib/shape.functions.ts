import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { MinistryIdea, ShapeAnswers } from "@/data/shape";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

const ChildSchema = z.object({ name: z.string().max(60), age: z.string().max(10) });

const AnswersSchema = z.object({
  city: z.string().max(80),
  zip: z.string().max(12),
  firstName: z.string().max(60),
  ageRange: z.string().max(40),
  marital: z.string().max(40),
  timePerMonth: z.string().max(40),
  household: z.string().max(200),
  children: z.array(ChildSchema).max(12),
  gifts: z.array(z.string().max(60)).max(25),
  giftsNote: z.string().max(600),
  giftLean: z.record(z.string(), z.string().max(80)),
  heart: z.array(z.string().max(60)).max(20),
  heartNote: z.string().max(600),
  abilities: z.array(z.string().max(60)).max(20),
  abilitiesNote: z.string().max(600),
  personality: z.record(z.string(), z.string().max(80)),
  settings: z.array(z.string().max(60)).max(10),
  experiences: z.array(z.string().max(80)).max(20),
  experienceNote: z.string().max(800),
  travel: z.string().max(60),
  frequency: z.string().max(60),
  groupSize: z.string().max(60),
  kidsWelcome: z.string().max(60),
  freeTalk: z.string().max(8000).optional().default(""),
  transcripts: z.record(z.string(), z.string().max(8000)).optional().default({}),
});

export const saveShapeProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnswersSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("shape_profiles").upsert(
      {
        owner_id: context.userId,
        city: data.city,
        zip: data.zip,
        children: data.children,
        answers: data,
        free_talk: data.freeTalk,
        transcripts: data.transcripts,
      },
      { onConflict: "owner_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getShapeProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("shape_profiles")
      .select("answers")
      .eq("owner_id", context.userId)
      .maybeSingle();

    const { data: sugg } = await context.supabase
      .from("shape_suggestions")
      .select("ideas")
      .eq("owner_id", context.userId)
      .maybeSingle();

    return {
      answers: (data?.answers ?? null) as ShapeAnswers | null,
      ideas: (sugg?.ideas ?? null) as MinistryIdea[] | null,
    };
  });

function describe(a: ShapeAnswers) {
  const kids = a.children
    .filter((c) => c.name.trim() || c.age.trim())
    .map((c) => `${c.name.trim() || "child"} (age ${c.age.trim() || "?"})`)
    .join(", ");
  const lean = Object.values(a.giftLean).filter(Boolean).join("; ");
  const personality = Object.values(a.personality).filter(Boolean).join("; ");
  return [
    `Location: ${[a.city, a.zip].filter(Boolean).join(" ") || "unspecified"}`,
    `Name: ${a.firstName || "unspecified"}`,
    `Age range: ${a.ageRange}. Marital status: ${a.marital}. Time per month: ${a.timePerMonth}.`,
    `Household: ${a.household || "not given"}. Children: ${kids || "none listed"}.`,
    `Spiritual gifts: ${a.gifts.join(", ") || "unspecified"}. Notes: ${a.giftsNote || "none"}.`,
    `Gift leanings: ${lean || "none"}.`,
    `Heart / causes: ${a.heart.join(", ") || "unspecified"}. What breaks their heart: ${a.heartNote || "none"}.`,
    `Abilities: ${a.abilities.join(", ") || "unspecified"}. Notes: ${a.abilitiesNote || "none"}.`,
    `Personality: ${personality || "unspecified"}. Preferred settings: ${a.settings.join(", ") || "unspecified"}.`,
    `Experiences: ${a.experiences.join(", ") || "none shared"}. Notes: ${a.experienceNote || "none"}.`,
    `Scope: travels ${a.travel || "?"}, ${a.frequency || "?"}, group size ${a.groupSize || "?"}, ${a.kidsWelcome || "?"}.`,
    `Spoken answers, in their own words:\n${
      Object.entries(a.transcripts ?? {})
        .filter(([, v]) => v.trim())
        .map(([k, v]) => `- ${k}: ${v.trim()}`)
        .join("\n") || "- none"
    }`,
    `Free talk: ${a.freeTalk?.trim() || "none"}`,
  ].join("\n");
}

const IDEA_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kind: { type: "string", enum: ["ministry", "need"] },
          shortTitle: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          whyItFits: { type: "string" },
          familyFriendly: { type: "boolean" },
        },
        required: ["kind", "shortTitle", "title", "description", "whyItFits", "familyFriendly"],
      },
    },
  },
  required: ["ideas"],
} as const;

export const generateMinistrySuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnswersSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ideas: MinistryIdea[]; error?: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ideas: [], error: "AI is not configured for this app yet." };

    const hasKids = data.children.some((c) => c.name.trim() || c.age.trim());

    const prompt = `You help Christians in a city design a practical neighborhood ministry they can post on a local map.

Here is one person's Rick Warren S.H.A.P.E. profile:
${describe(data)}

Write between 5 and 8 posts they can put straight on the local map. Rules:
- kind: "ministry" when they are offering something to neighbors, "need" when they said they could use help themselves. Include a "need" only when their own words show a real need; most posts should be ministries.
- Each must be concrete, doable in their own city, and match their gifts, abilities, personality, scope, and experiences.
- shortTitle: at most 24 characters, what shows under a map pin (e.g. "Free haircuts").
- title: a warm full title, at most 70 characters.
- description: 2-3 sentences addressed to neighbors, saying what is offered or needed, who it's for, and when.
- whyItFits: one sentence to the person, naming their own answers back to them.
- familyFriendly: true when their children could take part.
${hasKids ? "- At least two ideas must be family ministries their children can join, referencing their kids by name where natural." : "- Set familyFriendly true only when it genuinely applies."}
Return JSON only.`;

    let text = "";
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          input: prompt,
          stream: true,
          store: false,
          reasoning: { effort: "low" },
          text: {
            format: {
              type: "json_schema",
              name: "ministry_ideas",
              strict: true,
              schema: IDEA_SCHEMA,
            },
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        let message = "We couldn't reach the idea generator just now.";
        if (res.status === 402)
          message = "This app is out of AI credits. Ask the owner to add more, then try again.";
        else if (res.status === 429)
          message = "Too many requests right now. Try again in a minute.";
        else if (res.status === 403) message = "AI is turned off for this app right now.";
        console.error("shape suggestions gateway error", res.status, body.slice(0, 500));
        return { ideas: [], error: message };
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (reader) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload) as {
              type?: string;
              delta?: string;
              response?: { output_text?: string };
            };
            if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
              text += evt.delta;
            } else if (evt.type === "response.completed" && evt.response?.output_text) {
              if (!text) text = evt.response.output_text;
            }
          } catch {
            // ignore keep-alive / partial frames
          }
        }
      }
    } catch (err) {
      console.error("shape suggestions failed", err);
      return { ideas: [], error: "We couldn't reach the idea generator just now." };
    }

    let ideas: MinistryIdea[] = [];
    try {
      const parsed = JSON.parse(text) as { ideas?: MinistryIdea[] };
      ideas = (parsed.ideas ?? []).slice(0, 10).map((i) => ({
        kind: i.kind === "need" ? ("need" as const) : ("ministry" as const),
        shortTitle: String(i.shortTitle ?? "").slice(0, 24),
        title: String(i.title ?? "").slice(0, 90),
        description: String(i.description ?? "").slice(0, 800),
        whyItFits: String(i.whyItFits ?? "").slice(0, 400),
        familyFriendly: Boolean(i.familyFriendly),
      }));
    } catch {
      return { ideas: [], error: "The ideas came back garbled. Try again." };
    }

    if (ideas.length === 0) return { ideas: [], error: "No ideas came back. Try again." };

    await context.supabase
      .from("shape_suggestions")
      .upsert({ owner_id: context.userId, ideas }, { onConflict: "owner_id" });

    return { ideas };
  });

const PostSchema = z.object({
  kind: z.enum(["ministry", "need"]),
  shortTitle: z.string().trim().min(2).max(24),
  title: z.string().trim().max(90).optional().default(""),
  description: z.string().trim().min(10).max(400),
  city: z.string().trim().max(80).optional().default(""),
  zip: z.string().trim().max(10).optional().default(""),
});

/** Posts one generated (and possibly edited) idea to the map. */
export const postSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PostSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.city.length < 2 && data.zip.length < 4) {
      throw new Error("Add the city or ZIP so your pin lands in the right place.");
    }

    if (data.kind === "need") {
      const { data: userData } = await context.supabase.auth.getUser();
      if (!userData.user?.email_confirmed_at) {
        throw new Error("Please confirm your email before posting a need.");
      }
    }

    const { data: row, error } = await context.supabase
      .from(data.kind === "need" ? "user_needs" : "user_ministries")
      .insert({
        owner_id: context.userId,
        short_title: data.shortTitle,
        title: data.title || data.shortTitle,
        description: data.description,
        city: data.city,
        zip: data.zip,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (data.kind === "need") {
      const { neighborsOf, notifyUser } = await import("./social.server");
      for (const uid of await neighborsOf(data.city, data.zip)) {
        await notifyUser({
          userId: uid,
          actorId: context.userId,
          kind: "need",
          title: `New need nearby: ${data.shortTitle}`,
          body: `${data.city || data.zip} — ${data.description.slice(0, 120)}`,
          link: "/needs",
        });
      }
    }

    return { id: row.id, kind: data.kind };
  });

export const getShapeAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ access: "soon" | "full"; userId?: string }> => {
    const SUPABASE_URL = process.env["SUPABASE_URL"];
    const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const request = getRequest();
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !request?.headers) {
      return { access: "soon" };
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { access: "soon" };
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token || token.split(".").length !== 3) {
      return { access: "soon" };
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      return { access: "soon" };
    }

    return { access: "full", userId: data.claims.sub };
  },
);
