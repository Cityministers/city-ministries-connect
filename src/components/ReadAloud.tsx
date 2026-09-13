import { useServerFn } from "@tanstack/react-start";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { speakText } from "@/lib/speak.functions";

const STORAGE_KEY = "cm.readAloud";
const cache = new Map<string, string>();

type Props = {
  /** The words a friendly voice should read. */
  text: string;
};

/** Reads the question out loud, unless the reader has chosen to read it themselves. */
export default function ReadAloud({ text }: Props) {
  const speak = useServerFn(speakText);
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setOn(window.localStorage.getItem(STORAGE_KEY) === "on");
    setReady(true);
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  async function play() {
    setError(null);
    audioRef.current?.pause();
    let src = cache.get(text);
    if (!src) {
      setBusy(true);
      try {
        const res = await speak({ data: { text } });
        if (res.error || !res.audio) {
          setError(res.error ?? "We couldn't read that out loud right now.");
          return;
        }
        src = `data:audio/mpeg;base64,${res.audio}`;
        cache.set(text, src);
      } catch {
        setError("We couldn't read that out loud right now.");
        return;
      } finally {
        setBusy(false);
      }
    }
    const audio = new Audio(src);
    audioRef.current = audio;
    await audio.play().catch(() => {});
  }

  // Read each new question once, when the voice is switched on.
  useEffect(() => {
    if (!ready || !on) return;
    void play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, on, ready]);

  function toggle() {
    const next = !on;
    setOn(next);
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    if (!next) {
      audioRef.current?.pause();
      audioRef.current = null;
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void play()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-ink-soft px-4 py-2.5 text-base font-semibold text-sand ring-1 ring-mist/25 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <Volume2 className="size-5" aria-hidden="true" />
        )}
        Hear this question
      </button>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={!on}
        className="inline-flex items-center gap-2 text-base text-mist/70 underline underline-offset-4"
      >
        {on ? (
          <>
            <VolumeX className="size-4" aria-hidden="true" /> I'll just read it myself
          </>
        ) : (
          <>
            <Volume2 className="size-4" aria-hidden="true" /> Read the questions to me
          </>
        )}
      </button>
      {error && <span className="w-full text-sm text-rose">{error}</span>}
    </div>
  );
}
