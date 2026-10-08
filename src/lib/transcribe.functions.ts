import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  /** Base64 (no data: prefix) of a complete audio file. */
  audio: z.string().min(100).max(20_000_000),
  mimeType: z.string().max(60).default("audio/wav"),
});

function extFor(mime: string) {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("mpeg")) return "mp3";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  return "wav";
}

function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function transcribeHandler({ data }: { data: { audio: string; mimeType: string } }): Promise<{ text: string; error?: string }> {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { text: "", error: "Voice answers aren't set up for this app yet." };

    const bytes = decode(data.audio);
    if (bytes.byteLength < 2048) {
      return { text: "", error: "That recording was empty — please try again." };
    }

    const form = new FormData();
    form.append("model", "google/gemini-3.5-transcribe");
    form.append(
      "file",
      new Blob([bytes as unknown as BlobPart], { type: data.mimeType }),
      `answer.${extFor(data.mimeType)}`,
    );

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
    } catch (err) {
      console.error("transcription request failed", err);
      return { text: "", error: "We couldn't reach the transcriber. Try again." };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("transcription gateway error", res.status, body.slice(0, 400));
      let message = "We couldn't turn that recording into words. Try again.";
      if (res.status === 402)
        message = "This app is out of AI credits. Ask the owner to add more, then try again.";
      else if (res.status === 429)
        message = "Too many recordings at once. Wait a moment and retry.";
      else if (res.status === 403) message = "Voice answers are turned off for this app right now.";
      else if (res.status === 413) message = "That recording is too long. Try a shorter answer.";
      return { text: "", error: message };
    }

    const json = (await res.json().catch(() => null)) as { text?: string } | null;
    const text = (json?.text ?? "").trim();
    if (!text) return { text: "", error: "We didn't catch any words. Try recording again." };
    return { text };
}

/** Turns one spoken answer into text. The audio itself is never stored. */
export const transcribeAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(transcribeHandler);

/** Same transcription, open to signed-out visitors (used by the public Spiritual Rant). */
export const transcribeRant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(transcribeHandler);
