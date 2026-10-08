import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, HandHelping, Loader2, Mic, RotateCcw, Sparkles, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScriptureCard } from "@/components/ScriptureCard";
import { analyzeRant, type RantResult } from "@/lib/rant.functions";
import { transcribeAnswer } from "@/lib/transcribe.functions";
import { topicalVerses, topicsForKeywords, type YVTopic } from "@/lib/youversion-search";
import { usfmToReference } from "@/lib/bible";

export const Route = createFileRoute("/_authenticated/rant")({
  head: () => ({
    meta: [
      { title: "Spiritual Rant — City Ministers" },
      {
        name: "description",
        content:
          "Speak freely about what's on your heart. City Ministers listens, finds matching Bible verses, and can post your need for you. Nothing is recorded or saved.",
      },
      { property: "og:title", content: "Spiritual Rant — City Ministers" },
      {
        property: "og:description",
        content: "Talk it out. Get verses and let neighbors help. Your audio is never saved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RantPage,
});

const MAX_SECONDS = 180;

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
  const [needDismissed, setNeedDismissed] = useState(false);

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
      setNeedDismissed(false);
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
          "Get it off your chest. Talk for two or three minutes — we'll listen, find verses that speak to it, and offer to post any need you mention. Your audio is never saved.",
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
              ? t("Finding verses…")
              : recording
                ? t("Talking · {{time}} — tap to finish", { time: mmss })
                : result
                  ? t("Rant again")
                  : t("Tap and just talk")}
        </span>

        <p className="text-center text-base leading-relaxed text-mist/85">
          {t("Tell me about your problems — big or small — practical or super spiritual.")}
        </p>
        <p className="-mt-2 text-center text-sm text-mist/60">{t("2–3 min is best.")}</p>


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

          {result.need && !needDismissed && (
            <section className="flex flex-col gap-3 rounded-2xl bg-ink-soft/60 p-5 ring-1 ring-lemon/40">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-sand">
                <HandHelping className="size-5 text-lemon" aria-hidden="true" />
                {t("Would you like us to post this for you?")}
              </h2>
              <p className="text-sm text-mist/80">
                {t("We heard a need in what you shared. Here's a post drafted from your own words — you can change anything before it goes up.")}
              </p>
              <div className="flex flex-col gap-1 rounded-xl bg-ink/60 p-4 ring-1 ring-mist/15">
                {result.need.shortTitle && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-mist/60">{result.need.shortTitle}</span>
                )}
                <span className="text-base font-semibold text-sand">{result.need.title}</span>
                <span className="text-sm text-mist/85">{result.need.description}</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  to="/post-need"
                  search={{ short: result.need.shortTitle, title: result.need.title, description: result.need.description }}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-lemon px-5 py-3 text-base font-semibold text-ink transition hover:-translate-y-0.5"
                >
                  {t("Yes, post this need")}
                </Link>
                <button
                  type="button"
                  onClick={() => setNeedDismissed(true)}
                  className="inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 text-base font-semibold text-mist ring-1 ring-mist/25 transition hover:text-sand"
                >
                  {t("Not right now")}
                </button>
              </div>
            </section>
          )}

          <TopicVerses keywords={result.themes} />

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

/** YouVersion topics for the rant's keywords, with the active topic's verses and pivots. */
function TopicVerses({ keywords }: { keywords: string[] }) {
  const { t } = useTranslation();
  const [topics, setTopics] = useState<YVTopic[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [refs, setRefs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let off = false;
    setLoading(true);
    topicsForKeywords(keywords)
      .then((list) => {
        if (off) return;
        setTopics(list);
        setActive(list[0]?.text ?? keywords[0] ?? null);
        if (list.length === 0 && keywords.length === 0) setLoading(false);
      })
      .catch(() => !off && (setFailed(true), setLoading(false)));
    return () => {
      off = true;
    };
  }, [keywords.join("|")]);

  useEffect(() => {
    if (!active) return;
    let off = false;
    setLoading(true);
    topicalVerses(active)
      .then((ids) => {
        if (off) return;
        setRefs(ids.map((id) => usfmToReference(id)).filter((r): r is string => Boolean(r)).map((r) => `${r} (BSB)`));
        setFailed(false);
      })
      .catch(() => !off && setFailed(true))
      .finally(() => !off && setLoading(false));
    return () => {
      off = true;
    };
  }, [active]);

  const current = topics.find((tp) => tp.text === active);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-semibold text-sand">{t("Verses for you")}</h2>
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("Topics")}>
          {topics.map((tp) => (
            <button
              key={tp.text}
              type="button"
              onClick={() => setActive(tp.text)}
              aria-pressed={active === tp.text}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition ${
                active === tp.text ? "bg-youversion text-sand ring-youversion" : "bg-ink-soft/70 text-sand ring-mist/20 hover:ring-youversion/60"
              }`}
            >
              {tp.text}
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-mist/70">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t("Searching YouVersion…")}
        </p>
      ) : failed || refs.length === 0 ? (
        <p className="text-sm text-mist/70">{t("We couldn't find verses for that topic right now.")}</p>
      ) : (
        refs.map((ref) => <ScriptureCard key={ref} reference={ref} compact />)
      )}
      {current && current.subtopics.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-mist/60">{t("More on this topic")}</span>
          <div className="flex flex-wrap gap-2">
            {current.subtopics.slice(0, 8).map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  setTopics((list) => (list.some((x) => x.text === sub) ? list : [...list, { id: null, text: sub, subtopics: [] }]));
                  setActive(sub);
                }}
                className="rounded-full px-3 py-1 text-xs font-medium text-mist ring-1 ring-mist/25 transition hover:text-sand"
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
