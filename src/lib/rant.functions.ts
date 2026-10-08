import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  transcript: z.string().trim().min(10).max(8000),
});

const RANT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    themes: { type: "array", items: { type: "string" } },
    need: {
      type: "object",
      properties: {
        found: { type: "boolean" },
        shortTitle: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
      },
      required: ["found", "shortTitle", "title", "description"],
      additionalProperties: false,
    },
  },
  required: ["summary", "themes", "need"],
  additionalProperties: false,
} as const;

export type RantNeedDraft = { shortTitle: string; title: string; description: string };

export type RantResult = {
  summary: string;
  themes: string[];
  need: RantNeedDraft | null;
  error?: string;
};

/**
 * Analyzes one spoken "spiritual rant" transcript: pulls themes, picks fitting
 * well-known Bible references, and matches live posts. The audio itself was
 * already transcribed and discarded; only this text is processed, and nothing
 * is stored. Public on purpose — signed-out visitors can rant too — and safe
 * because nothing user-scoped is read or written and inputs are length-capped.
 */
export const analyzeRant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<RantResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { summary: "", themes: [], need: null, error: "AI is not configured for this app yet." };
    }

    const prompt = `A Christian member just spoke freely ("ranted") about what is on their heart. Here is the transcript:

"""
${data.transcript}
"""

Respond with JSON only:
- summary: one warm, pastoral sentence (at most 40 words) reflecting back what they shared, addressed to them as "you". Never preachy, never judgmental.
- themes: 3 to 6 short lowercase theme keywords (1-2 words each) such as "loneliness", "provision", "fear", "grief", "gratitude", "calling".
- need: if the speaker mentioned a concrete need neighbors could help with (practical help, a ride, food, rent, a job, childcare, a repair, company, prayer for something specific), set found=true and draft a post IN THEIR OWN WORDS using only things they actually said — never invent details. shortTitle: 1-3 words (max 24 chars). title: one sentence (max 90 chars). description: 2-4 first-person sentences (max 600 chars). If no concrete need was mentioned, set found=false and leave the strings empty.`;

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
        return { summary: "", themes: [], need: null, error: message };
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
      return { summary: "", themes: [], need: null, error: "We couldn't reflect on that just now. Try again." };
    }

    let summary = "";
    let themes: string[] = [];
    let need: RantNeedDraft | null = null;
    try {
      const parsed = JSON.parse(text) as {
        summary?: string;
        themes?: string[];
        need?: { found?: boolean; shortTitle?: string; title?: string; description?: string };
      };
      summary = String(parsed.summary ?? "").slice(0, 300);
      themes = (parsed.themes ?? []).map((t) => String(t).slice(0, 40)).slice(0, 6);
      const n = parsed.need;
      if (n?.found && n.title && n.description) {
        need = {
          shortTitle: String(n.shortTitle ?? "").slice(0, 24),
          title: String(n.title).slice(0, 90),
          description: String(n.description).slice(0, 600),
        };
      }
    } catch {
      return { summary: "", themes: [], need: null, error: "The reflection came back garbled. Try again." };
    }

    if (themes.length === 0) {
      return { summary, themes, need, error: "We couldn't pull themes from that. Try again." };
    }
    return { summary, themes, need };
  });
