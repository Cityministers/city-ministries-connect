import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Loader2, MapPin, Send, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { respondToMeetup, rescheduleMeetup } from "@/lib/meetups.functions";
import { MeetupScheduler, type LatLng } from "./MeetupScheduler";

export type RespondIntent = "accept" | "later" | "decline";

type M = {
  id: string;
  meetAt: string;
  location: string;
  lat: number | null;
  lng: number | null;
  photoUrl?: string | null;
  status: "pending" | "accepted" | "declined";
  mine: boolean;
};

/** Confirm popup: shows the meetup, an editable ready-made message, Send, and Suggest a new time. */
export function MeetupRespondDialog({
  meetup: m,
  otherName,
  otherAvatar,
  intent,
  onClose,
  onDone,
}: {
  meetup: M;
  otherName: string;
  otherAvatar?: string | null;
  intent: RespondIntent;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, i18n } = useTranslation();
  const respond = useServerFn(respondToMeetup);
  const reschedule = useServerFn(rescheduleMeetup);
  const when = new Date(m.meetAt);
  const fmtDay = (d: Date) => d.toLocaleDateString(i18n.language, { weekday: "long", month: "long", day: "numeric" });
  const fmtTime = (d: Date) => d.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" });
  const vars = { day: fmtDay(when), time: fmtTime(when), place: m.location };

  const template = (): string => {
    if (intent === "accept")
      return m.status === "declined"
        ? t("Good news! It turns out I can make it after all. See you on {{day}} at {{time}}.", vars)
        : t("Sounds great! See you on {{day}} at {{time}} at {{place}}.", vars);
    if (intent === "later")
      return m.status === "accepted"
        ? t("I'm sorry, something came up and I'm not sure I can make {{day}} anymore. I'll confirm soon.", vars)
        : t("Thanks for the invite! I'm not sure yet. I'll get back to you soon.");
    if (m.mine) return t("I'm sorry, I need to cancel the meetup I requested for {{day}}.", vars);
    return m.status === "accepted"
      ? t("I'm so sorry, but I need to cancel our meetup on {{day}}. I apologize for the change of plans.", vars)
      : t("Thank you so much for the invite. Unfortunately I can't make it this time.");
  };

  const [message, setMessage] = useState(template);
  const [busy, setBusy] = useState(false);
  const [resched, setResched] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("18:00");
  const [location, setLocation] = useState(m.location);
  const [pin, setPin] = useState<LatLng | null>(m.lat != null && m.lng != null ? { lat: m.lat, lng: m.lng } : null);

  const newAt = () => {
    if (!date) return null;
    const [h, mi] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h ?? 0, mi ?? 0, 0, 0);
    return d;
  };
  const reschedMsg = (d: Date | null, place: string) =>
    d
      ? t("Could we move our meetup to {{day}} at {{time}} at {{place}}?", { day: fmtDay(d), time: fmtTime(d), place })
      : "";

  const title =
    intent === "accept" ? t("Accept this meetup") : intent === "later" ? t("Maybe later") : t("Decline this meetup");

  async function send() {
    setBusy(true);
    try {
      if (resched) {
        const d = newAt();
        if (!d || !location.trim()) throw new Error(t("Pick a day, time and place."));
        await reschedule({
          data: {
            id: m.id,
            meetAt: d.toISOString(),
            location: location.trim(),
            lat: pin?.lat,
            lng: pin?.lng,
            message: message.trim() || reschedMsg(d, location.trim()),
          },
        });
      } else {
        await respond({
          data: {
            id: m.id,
            accept: intent === "accept",
            later: intent === "later" || undefined,
            message: message.trim() || undefined,
          },
        });
      }
      toast.success(t("Sent"));
      onDone();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("Something went wrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-ink/85 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top))] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-b-2xl bg-ink-soft p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] ring-1 ring-mist/25 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {otherAvatar ? (
              <img src={otherAvatar} alt="" className="size-12 shrink-0 rounded-full object-cover ring-1 ring-mist/35" />
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink font-display text-xl text-sand ring-1 ring-mist/35">
                {otherName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="whitespace-nowrap text-sm uppercase tracking-[0.15em] text-lemon/80">{title}</p>
              <h2 className="font-display text-xl text-sand">{t("Meetup with {{name}}", { name: otherName })}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t("Close")} className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/25">
            <X className="size-5" />
          </button>
        </div>

        {m.photoUrl && <img src={m.photoUrl} alt="" className="max-h-40 w-full rounded-xl object-cover ring-1 ring-mist/20" />}
        <div className="rounded-xl bg-ink p-3 ring-1 ring-mist/20">
          <p className="flex items-center gap-2 text-base font-semibold text-sand">
            <CalendarClock className="size-5 text-lemon" /> {vars.day} · {vars.time}
          </p>
          <p className="mt-1 flex items-center gap-2 text-base text-mist/85">
            <MapPin className="size-5 text-lemon" /> {m.location}
          </p>
        </div>

        {resched && (
          <MeetupScheduler
            date={date}
            onDate={(d) => { setDate(d); setMessage(reschedMsg(new Date(d.getFullYear(), d.getMonth(), d.getDate(), ...(time.split(":").map(Number) as [number, number])), location)); }}
            time={time}
            onTime={(v) => { setTime(v); const d = date ? new Date(date) : null; if (d) { const [h, mi] = v.split(":").map(Number); d.setHours(h ?? 0, mi ?? 0); } setMessage(reschedMsg(d, location)); }}
            location={location}
            onLocation={(v) => { setLocation(v); setMessage(reschedMsg(newAt(), v)); }}
            pin={pin}
            onPin={setPin}
          />
        )}

        <label className="flex flex-col gap-2">
          <span className="text-sm uppercase tracking-[0.15em] text-lemon/80">{t("Your message")}</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            className="rounded-xl bg-ink px-3 py-2 text-base text-sand ring-1 ring-mist/30 focus:outline-none focus:ring-lemon/60"
          />
        </label>

        <button
          type="button"
          disabled={busy}
          onClick={() => void send()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ember/90 px-5 py-3 text-base font-semibold text-sand ring-1 ring-ember disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          {resched ? t("Send new time") : t("Send")}
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-full bg-ink px-4 py-3 text-base font-semibold text-sand ring-1 ring-mist/30">
            {t("Back")}
          </button>
          <button
            type="button"
            onClick={() => { const next = !resched; setResched(next); setMessage(next ? reschedMsg(newAt(), location) : template()); }}
            className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ink px-3 py-3 text-sm font-semibold text-sand ring-1 ring-lemon/50"
          >
            <CalendarClock className="size-4 text-lemon" />
            {resched ? t("Keep this time") : t("Suggest a new time")}
          </button>
        </div>
      </div>
    </div>
  );
}
