import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  text: z.string().min(1).max(1200),
});

/** Reads a short question out loud in a warm, friendly voice. Returns base64 mp3. */
export const speakText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<{ audio: string; error?: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { audio: "", error: "The reading voice isn't set up for this app yet." };

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini-tts",
          input: data.text,
          voice: "alloy",
          response_format: "mp3",
          instructions:
            "Speak like a warm, gentle friend at church: unhurried, kind and encouraging.",
        }),
      });
    } catch (err) {
      console.error("speech request failed", err);
      return { audio: "", error: "We couldn't reach the reading voice. Try again." };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("speech gateway error", res.status, body.slice(0, 400));
      let message = "We couldn't read that out loud right now.";
      if (res.status === 402)
        message = "This app is out of AI credits. Ask the owner to add more, then try again.";
      else if (res.status === 429) message = "Too many requests at once. Wait a moment and retry.";
      else if (res.status === 403) message = "The reading voice is turned off for this app.";
      return { audio: "", error: message };
    }

    const bytes = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return { audio: btoa(binary) };
  });
