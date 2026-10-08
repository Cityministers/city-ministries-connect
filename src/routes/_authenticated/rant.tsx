import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, HandHelping, Loader2, Mic, RotateCcw, Sparkles, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScriptureCard } from "@/components/ScriptureCard";
import { analyzeRant, type RantResult } from "@/lib/rant.functions";
import { transcribeAnswer } from "@/lib/transcribe.functions";

export const Route = createFileRoute("/_authenticated/rant")({
  head: () => ({
    meta: [
      { title: "Spiritual Rant — City Ministers" },
      {
        name: "description",
        content:
          "Speak freely about what's on your heart. City Ministers listens, finds matching Bible verses, and points you to ministries and needs nearby. Nothing is recorded or saved.",
      },
      { property: "og:title", content: "Spiritual Rant — City Ministers" },
      {
        property: "og:description",
        content: "Talk it out. Get verses and ways to act on it. Your audio is never saved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RantPage,
});

const MAX_SECONDS = 90;

/** Encodes captured PCM chunks as a complete 16 kHz mono WAV file. */
function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const target = 16000;
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let at = 0;
  for (const c of chunks) {
    merged.set(c, at);
    at += c.length;
  }
  const ratio = sampleRate / target;
  const outLength = Math.max(1, Math.floor(total / ratio));
  const samples = new Int16Array(outLength);
  for (let i = 0; i < outLength; i += 1) {
    const raw = merged[Math.floor(i * ratio)] ?? 0;
    const clamped = Math.max(-1, Math.min(1, raw));
    samples[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, target, true);
  view.setUint32(28, target * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  new Int16Array(buffer, 44).set(samples);
  return new Blob([buffer], { type: "audio/wav" });
}

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function RantPage() {
  const { t } = useTranslation();
  const transcribe = useServerFn(transcribeAnswer);
  const analyze = useServerFn(analyzeRant);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [busy, setBusy] = useState<"transcribe" | "analyze" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RantResult | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const stoppingRef = useRef(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      void ctxRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => {
    if (recording && seconds >= MAX_SECONDS) void stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, recording]);

  async function start() {
    setError(null);
    setResult(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(t("We can't hear you. Allow microphone access in your browser, then tap the microphone again."));
      return;
    }
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const node = ctx.createScriptProcessor(4096, 1, 1);
    chunksRef.current = [];
    node.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      chunksRef.current.push(new Float32Array(input));
      let peak = 0;
      for (let i = 0; i < input.length; i += 64) peak = Math.max(peak, Math.abs(input[i] ?? 0));
      setLevel(peak);
    };
    source.connect(node);
    node.connect(ctx.destination);

    streamRef.current = stream;
    ctxRef.current = ctx;
    nodeRef.current = node;
    stoppingRef.current = false;
    setSeconds(0);
    setRecording(true);
  }

  async function stop() {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    setRecording(false);
    setLevel(0);

    const ctx = ctxRef.current;
    const rate = ctx?.sampleRate ?? 48000;
    nodeRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    await ctx?.close().catch(() => {});
    ctxRef.current = null;
    nodeRef.current = null;
    streamRef.current = null;

    const blob = encodeWav(chunksRef.current, rate);
    chunksRef.current = [];
    if (blob.size < 4096) {
      setError(t("That recording was empty — tap the microphone and speak after it starts."));
      return;
    }

    setBusy("transcribe");
    try {
      const base64 = await toBase64(blob);
      const heard = await transcribe({ data: { audio: base64, mimeType: "audio/wav" } });
      if (heard.error || !heard.text) {
        setError(heard.error ?? t("We didn't catch any words. Try again."));
        return;
      }
      setBusy("analyze");
      const res = await analyze({ data: { transcript: heard.text } });
      if (res.error) {
        setError(res.error);
        return;
      }
      setResult(res);
    } catch {
      setError(t("We couldn't process that. Try again."));
    } finally {
      setBusy(null);
    }
  }

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 pb-16 pt-6">
      <div className="flex items-center gap-3">
        <Link
          to="/map"
          className="grid size-10 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
          aria-label={t("Back to the map")}
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <h1 className="font-display text-3xl font-semibold text-sand">{t("Spiritual Rant")}</h1>
      </div>

      <p className="text-base leading-relaxed text-mist/80">
        {t(
          "Get it off your chest. Talk for up to 90 seconds — we'll listen, find verses that speak to it, and point you to ministries and needs nearby. Your audio is never saved.",
        )}
      </p>

      <div className="flex flex-col items-center gap-4 rounded-2xl bg-ink-soft/40 p-6 ring-1 ring-mist/15">
        <button
          type="button"
          onClick={() => void (recording ? stop() : start())}
          disabled={busy !== null}
          aria-pressed={recording}
          className={`grid size-24 place-items-center rounded-full transition hover:-translate-y-0.5 disabled:opacity-60 ${
            recording ? "bg-emerald-light text-ink" : "bg-lemon text-ink"
          }`}
          aria-label={recording ? t("Stop and reflect") : t("Start talking")}
        >
          {busy ? (
            <Loader2 className="size-10 animate-spin" aria-hidden="true" />
          ) : recording ? (
            <Square className="size-10" aria-hidden="true" />
          ) : (
            <Mic className="size-10" aria-hidden="true" />
          )}
        </button>

        <span className="text-base font-semibold text-sand">
          {busy === "transcribe"
            ? t("Listening…")
            : busy === "analyze"
              ? t("Finding verses and ministries…")
              : recording
                ? t("Talking · {{time}} — tap to finish", { time: mmss })
                : result
                  ? t("Rant again")
                  : t("Tap and just talk")}
        </span>

        {recording && (
          <div className="flex h-6 items-end justify-center gap-1" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-emerald-light/80 transition-all"
                style={{
                  height: `${Math.max(4, Math.min(24, level * 90 * (1 - Math.abs(i - 4) / 7)))}px`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-rose/15 px-4 py-3 text-base text-rose ring-1 ring-rose/30">
          {error}
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-6">
          {result.summary && (
            <p className="rounded-2xl bg-ink-soft/60 p-5 text-lg italic leading-relaxed text-sand/90 ring-1 ring-mist/15">
              {result.summary}
            </p>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-sand">
              <Sparkles className="size-5 text-lemon" aria-hidden="true" />
              {t("What we heard")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {result.themes.map((theme) => (
                <span
                  key={theme}
                  className="rounded-full bg-ink-soft/70 px-3 py-1.5 text-sm font-medium text-sand ring-1 ring-mist/20"
                >
                  {theme}
                </span>
              ))}
            </div>
          </section>

          {result.verseRefs.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-semibold text-sand">{t("Verses for you")}</h2>
              {result.verseRefs.map((ref) => (
                <ScriptureCard key={ref} reference={ref} compact />
              ))}
            </section>
          )}

          {result.posts.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-sand">
                <HandHelping className="size-5 text-lemon" aria-hidden="true" />
                {t("Ways to act on it")}
              </h2>
              {result.posts.map((post) => (
                <Link
                  key={post.id}
                  to={post.kind === "need" ? "/needs" : "/map"}
                  search={{ new: post.id }}
                  className="flex flex-col gap-1 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15 transition hover:ring-lemon/50"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-mist/60">
                    {post.kind === "need" ? t("Need") : t("Ministry")}
                    {post.city ? ` · ${post.city}` : ""}
                  </span>
                  <span className="text-base font-semibold text-sand">{post.title}</span>
                  <span className="line-clamp-2 text-sm text-mist/80">{post.description}</span>
                </Link>
              ))}
            </section>
          )}

          <button
            type="button"
            onClick={() => {
              setResult(null);
              void start();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-lg font-semibold text-ink transition hover:-translate-y-0.5"
          >
            <RotateCcw className="size-5" aria-hidden="true" /> {t("Rant again")}
          </button>
        </div>
      )}
    </div>
  );
}
