import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  transcript: z.string().trim().min(10).max(8000),
});

const RANT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    themes: { type: "array", items: { type: "string" } },
    verseRefs: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "themes", "verseRefs"],
  additionalProperties: false,
} as const;

export type RantPost = {
  id: string;
  kind: "ministry" | "need";
  shortTitle: string;
  title: string;
  description: string;
  city: string;
};

export type RantResult = {
  summary: string;
  themes: string[];
  verseRefs: string[];
  posts: RantPost[];
  error?: string;
};

function themeWords(themes: string[]): string[] {
  return themes
    .join(" ")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3);
}

/** Matches rant themes against live ministry and need posts by word overlap. */
async function matchPosts(
  supabase: {
    from: (table: string) => any;
  },
  themes: string[],
): Promise<RantPost[]> {
  const keys = themeWords(themes);
  if (keys.length === 0) return [];

  const select = "id, short_title, title, description, city";
  const [ministries, needs] = await Promise.all([
    supabase.from("user_ministries").select(select).order("created_at", { ascending: false }).limit(150),
    supabase.from("user_needs").select(select).order("created_at", { ascending: false }).limit(150),
  ]);

  const score = (row: { short_title: string; title: string; description: string }) => {
    const text = `${row.short_title} ${row.title} ${row.description}`.toLowerCase();
    return keys.reduce((n, k) => (text.includes(k) ? n + 1 : n), 0);
  };

  const toPost = (kind: "ministry" | "need") => (row: any): RantPost => ({
    id: String(row.id),
    kind,
    shortTitle: String(row.short_title ?? "").slice(0, 24),
    title: String(row.title ?? row.short_title ?? "").slice(0, 90),
    description: String(row.description ?? "").slice(0, 400),
    city: String(row.city ?? "").slice(0, 80),
  });

  const ranked = [
    ...((ministries.data ?? []) as any[]).map((r) => ({ s: score(r), p: toPost("ministry")(r) })),
    ...((needs.data ?? []) as any[]).map((r) => ({ s: score(r), p: toPost("need")(r) })),
  ]
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);

  return ranked.slice(0, 4).map((r) => r.p);
}

/**
 * Analyzes one spoken "spiritual rant" transcript: pulls themes, picks fitting
 * well-known Bible references, and matches live posts. The audio itself was
 * already transcribed and discarded; only this text is processed, and nothing
 * is stored.
 */
export const analyzeRant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }): Promise<RantResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { summary: "", themes: [], verseRefs: [], posts: [], error: "AI is not configured for this app yet." };
    }

    const prompt = `A Christian member just spoke freely ("ranted") about what is on their heart. Here is the transcript:

"""
${data.transcript}
"""

Respond with JSON only:
- summary: one warm, pastoral sentence (at most 40 words) reflecting back what they shared, addressed to them as "you". Never preachy, never judgmental.
- themes: 3 to 6 short lowercase theme keywords (1-2 words each) such as "loneliness", "provision", "fear", "grief", "gratitude", "calling".
- verseRefs: 2 to 4 well-known Bible references (format "Book chapter:verse", e.g. "Psalm 34:18") that speak directly to those themes. Use only real, widely known verses.`;

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
          text: { format: { type: "json_schema", name: "rant_reflection", strict: true, schema: RANT_SCHEMA } },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        let message = "We couldn't reflect on that just now. Try again.";
        if (res.status === 402)
          message = "This app is out of AI credits. Ask the owner to add more, then try again.";
        else if (res.status === 429) message = "Too many requests right now. Try again in a minute.";
        else if (res.status === 403) message = "AI is turned off for this app right now.";
        console.error("rant analysis gateway error", res.status, body.slice(0, 500));
        return { summary: "", themes: [], verseRefs: [], posts: [], error: message };
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
      console.error("rant analysis failed", err);
      return { summary: "", themes: [], verseRefs: [], posts: [], error: "We couldn't reflect on that just now. Try again." };
    }

    let summary = "";
    let themes: string[] = [];
    let verseRefs: string[] = [];
    try {
      const parsed = JSON.parse(text) as { summary?: string; themes?: string[]; verseRefs?: string[] };
      summary = String(parsed.summary ?? "").slice(0, 300);
      themes = (parsed.themes ?? []).map((t) => String(t).slice(0, 40)).slice(0, 6);
      verseRefs = (parsed.verseRefs ?? []).map((r) => String(r).slice(0, 40)).slice(0, 4);
    } catch {
      return { summary: "", themes: [], verseRefs: [], posts: [], error: "The reflection came back garbled. Try again." };
    }

    if (themes.length === 0) {
      return { summary, themes, verseRefs, posts: [], error: "We couldn't pull themes from that. Try again." };
    }

    const posts = await matchPosts(context.supabase, themes).catch(() => [] as RantPost[]);
    return { summary, themes, verseRefs, posts };
  });
