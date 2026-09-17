import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { z } from "zod";
import { LANGUAGES } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

const Input = z.object({
  lang: z.string().min(2).max(5),
  items: z
    .array(
      z.object({
        key: z.string().min(1).max(300),
        text: z.string().min(1).max(3000),
      }),
    )
    .min(1)
    .max(20),
});

export type TranslationResult = {
  translations: Record<string, string>;
  error?: string;
};

function serviceClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

function hashText(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

function languageName(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

const SYSTEM_PROMPT = [
  "You translate content for a neighborhood ministry app called City Ministers.",
  "Translate each item's text into the requested target language.",
  "Keep the tone warm, natural and conversational — like a friendly neighbor, not a machine.",
  "Ministry and community terms should sound natural to local speakers, not stiff.",
  "Preserve placeholders like {{name}} or {{count}} exactly, and never translate URLs, emails or phone numbers.",
  "Never add quotation marks, notes or explanations — only the translations.",
].join(" ");

/** One streamed gateway call that translates a batch of short texts. */
async function aiTranslate(
  items: { key: string; text: string }[],
  targetLanguage: string,
  apiKey: string,
): Promise<{ map: Record<string, string>; error?: string }> {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["translations"],
    properties: {
      translations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["key", "text"],
          properties: { key: { type: "string" }, text: { type: "string" } },
        },
      },
    },
  };

  let res: Response;
  try {
    res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        include: ["reasoning.encrypted_content"],
        reasoning: { effort: "low" },
        instructions: `${SYSTEM_PROMPT} Target language: ${targetLanguage}.`,
        input: `Translate these into ${targetLanguage}. Reply with the same keys.\n${JSON.stringify({ items })}`,
        text: {
          format: {
            type: "json_schema",
            name: "translations",
            strict: true,
            schema,
          },
        },
      }),
    });
  } catch (err) {
    console.error("translate request failed", err);
    return { map: {}, error: "network" };
  }

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    console.error("translate gateway error", res.status, body.slice(0, 400));
    return { map: {}, error: res.status === 402 ? "credits" : "gateway" };
  }

  // Consume the SSE stream and accumulate the output text deltas.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && event.delta) {
          output += event.delta;
        } else if (event.type === "response.completed" && event.response?.output_text) {
          output = event.response.output_text;
        }
      } catch {
        // ignore malformed SSE fragments
      }
    }
  }

  try {
    const parsed = JSON.parse(output) as { translations?: { key: string; text: string }[] };
    const map: Record<string, string> = {};
    for (const item of parsed.translations ?? []) {
      if (typeof item.key === "string" && typeof item.text === "string" && item.text.trim()) {
        map[item.key] = item.text.trim();
      }
    }
    return { map };
  } catch {
    console.error("translate parse error", output.slice(0, 300));
    return { map: {}, error: "parse" };
  }
}

/**
 * Translates short user-facing texts (post titles, descriptions, reasons) into a
 * target language, backed by a per-language translation memory so each unique
 * text is only ever sent to the AI once.
 */
export const translateTexts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<TranslationResult> => {
    const { lang, items } = data;

    // English is the source language — nothing to do.
    if (lang === "en") {
      return { translations: Object.fromEntries(items.map((i) => [i.key, i.text])) };
    }

    const db = serviceClient();
    const hashes = new Map(items.map((i) => [hashText(i.text), i.text]));
    const result: Record<string, string> = {};
    const missing: { key: string; text: string }[] = [];

    if (db) {
      const { data: cached, error } = await db
        .from("post_translations")
        .select("content_hash, translated")
        .eq("lang", lang)
        .in("content_hash", [...hashes.keys()]);
      if (!error && cached) {
        const byHash = new Map(cached.map((row) => [row.content_hash, row.translated]));
        for (const item of items) {
          const hit = byHash.get(hashText(item.text));
          if (hit) result[item.key] = hit;
          else missing.push(item);
        }
      } else {
        if (error) console.error("translation cache read failed", error.message);
        missing.push(...items);
      }
    } else {
      missing.push(...items);
    }

    if (missing.length > 0) {
      const apiKey = process.env["LOVABLE_API_KEY"];
      if (!apiKey) return { translations: result, error: "config" };

      const { map, error } = await aiTranslate(missing, languageName(lang), apiKey);
      if (error) return { translations: result, error };

      for (const item of missing) {
        const translated = map[item.key];
        if (translated) result[item.key] = translated;
      }

      if (db) {
        const rows = missing
          .filter((item) => map[item.key])
          .map((item) => ({
            content_hash: hashText(item.text),
            lang,
            translated: map[item.key],
          }));
        if (rows.length > 0) {
          const { error: insertError } = await db
            .from("post_translations")
            .upsert(rows, { onConflict: "content_hash,lang" });
          if (insertError) console.error("translation cache write failed", insertError.message);
        }
      }
    }

    return { translations: result };
  });
