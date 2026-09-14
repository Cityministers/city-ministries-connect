import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, Mic, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { transcribeAnswer } from "@/lib/transcribe.functions";

type Props = {
  label: string;
  hint?: string;
  value: string;
  onText: (text: string) => void;
  onNext?: (() => void) | undefined;
  onSaveExit?: (() => void) | undefined;
  maxSeconds?: number;
};

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

export default function VoiceAnswer({
  label,
  hint,
  value,
  onText,
  onNext,
  onSaveExit,
  maxSeconds = 90,
}: Props) {
  const transcribe = useServerFn(transcribeAnswer);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const stoppingRef = useRef(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void ctxRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => {
    if (recording && seconds >= maxSeconds) void stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, recording]);

  async function start() {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(
        "We can't hear you. Allow microphone access in your browser, then tap Record again.",
      );
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

  /** Slices off the audio so far as this question's answer and keeps recording. */
  async function nextQuestion() {
    if (!recording || busy) return;
    const chunks = chunksRef.current;
    chunksRef.current = [];
    const rate = ctxRef.current?.sampleRate ?? 48000;
    setSeconds(0);
    const blob = encodeWav(chunks, rate);
    const onTextCb = onText;
    const onNextCb = onNext;
    if (blob.size >= 4096) {
      setBusy(true);
      try {
        const base64 = await toBase64(blob);
        const res = await transcribe({ data: { audio: base64, mimeType: "audio/wav" } });
        if (res.error) setError(res.error);
        if (res.text) onTextCb(res.text);
      } catch {
        setError("We couldn't turn that recording into words. Try again.");
      } finally {
        setBusy(false);
      }
    }
    onNextCb?.();
  }

  async function stop() {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    setRecording(false);
    setLevel(0);

    const ctx = ctxRef.current;
    const rate = ctx?.sampleRate ?? 48000;
    nodeRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    await ctx?.close().catch(() => {});
    ctxRef.current = null;
    nodeRef.current = null;
    streamRef.current = null;

    const blob = encodeWav(chunksRef.current, rate);
    chunksRef.current = [];
    if (blob.size < 4096) {
      setError("That recording was empty — try again and speak after tapping Record.");
      return;
    }

    setBusy(true);
    try {
      const base64 = await toBase64(blob);
      const res = await transcribe({ data: { audio: base64, mimeType: "audio/wav" } });
      if (res.error) setError(res.error);
      if (res.text) onText(res.text);
    } catch {
      setError("We couldn't turn that recording into words. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  async function toWriting() {
    if (recording) await stop();
    setMode("write");
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-ink-soft/40 p-4 ring-1 ring-mist/15">
      <span className="font-display text-3xl font-semibold leading-snug text-sand">{label}</span>
      {hint && <span className="text-base text-mist/60">{hint}</span>}

      {mode === "voice" ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void (recording ? stop() : start())}
            disabled={busy}
            aria-pressed={recording}
            className={`inline-flex flex-1 items-center justify-center gap-3 rounded-full px-6 py-4 text-lg font-semibold transition ${
              recording
                ? "bg-emerald-light text-ink"
                : "bg-lemon text-ink hover:-translate-y-0.5 disabled:opacity-60"
            }`}
          >
            {busy ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Writing down what you
                said…
              </>
            ) : recording ? (
              <>
                <Square className="size-5" aria-hidden="true" /> Done talking · {mmss}
              </>
            ) : value ? (
              <>
                <RotateCcw className="size-5" aria-hidden="true" /> Record again
              </>
            ) : (
              <>
                <Mic className="size-5" aria-hidden="true" /> Just talk, we do the rest
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => void toWriting()}
            aria-label="Write my answer instead"
            title="Write my answer instead"
            className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-ink-soft/70 text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft"
          >
            <Pencil className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <textarea
            value={value}
            onChange={(e) => onText(e.target.value)}
            rows={4}
            placeholder="Write your answer here…"
            className="min-h-28 flex-1 rounded-2xl bg-ink/60 px-4 py-3 text-base leading-relaxed text-sand ring-1 ring-mist/20 outline-none placeholder:text-mist/50 focus:ring-lemon/60"
          />
          <button
            type="button"
            onClick={() => setMode("voice")}
            aria-label="Talk my answer instead"
            title="Talk my answer instead"
            className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-ink-soft/70 text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft"
          >
            <Mic className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {onSaveExit && (
        <button
          type="button"
          onClick={onSaveExit}
          className="inline-flex min-h-11 items-center justify-center text-base font-semibold text-mist/75 underline underline-offset-4 transition hover:text-sand"
        >
          Save &amp; exit
        </button>
      )}


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

      {recording && onNext && (
        <button
          type="button"
          onClick={() => void nextQuestion()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-lg font-semibold text-ink transition hover:-translate-y-0.5"
        >
          Next Question <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      )}

      {value && !recording && (
        <div className="flex flex-col gap-3">
          <p className="rounded-xl bg-ink/60 px-4 py-3 text-base leading-relaxed text-sand">
            “{value}”
          </p>
          {onNext && (
            <button
              type="button"
              onClick={() => onNext?.()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-lg font-semibold text-ink transition hover:-translate-y-0.5"
            >
              Next Question <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-rose/15 px-4 py-3 text-base text-rose ring-1 ring-rose/30">
          {error}
        </p>
      )}
    </div>
  );
}
