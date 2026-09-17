import { useServerFn } from "@tanstack/react-start";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setOn(window.localStorage.getItem(STORAGE_KEY) === "on");
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
          setError(res.error ?? t("We couldn't read that out loud right now."));
          return;
        }
        src = `data:audio/mpeg;base64,${res.audio}`;
        cache.set(text, src);
      } catch {
        setError(t("We couldn't read that out loud right now."));
        return;
      } finally {
        setBusy(false);
      }
    }
    const audio = new Audio(src);
    audioRef.current = audio;
    await audio.play().catch(() => {});
  }

  // Read each new question once when the reader has opted in.
  useEffect(() => {
    if (!on) return;
    void play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, on]);

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
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={on}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink-soft/70 px-4 py-2.5 text-base font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t("Preparing audio…")}
          </>
        ) : on ? (
          <>
            <VolumeX className="size-4" aria-hidden="true" /> {t("Stop reading aloud")}
          </>
        ) : (
          <>
            <Volume2 className="size-4" aria-hidden="true" /> {t("Read this and following questions")}
          </>
        )}
      </button>
      {error && <span className="w-full text-sm text-rose">{error}</span>}
    </div>
  );
}
