import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Check, Loader2, MapPin, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { respondToMeetup, type MeetupDTO } from "@/lib/meetups.functions";
import { MeetupDetailsSheet } from "@/components/meetup/MeetupDetailsSheet";

export function MeetupCard({
  meetup,
  otherName,
  onChanged,
}: {
  meetup: MeetupDTO;
  otherName: string;
  onChanged: () => void;
}) {
  const { t, i18n } = useTranslation();
  const respond = useServerFn(respondToMeetup);
  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const when = new Date(meetup.meetAt);
  const day = when.toLocaleDateString(i18n.language, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const time = when.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" });

  async function answer(accept: boolean) {
    setBusy(true);
    setError(null);
    try {
      await respond({ data: { id: meetup.id, accept, note: note.trim() || undefined } });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Something went wrong."));
    } finally {
      setBusy(false);
    }
  }

  const statusChip =
    meetup.status === "accepted" ? (
      <span className="rounded-full bg-tone-emerald/20 px-3 py-1 text-sm font-semibold text-tone-emerald ring-1 ring-tone-emerald/40">
        {t("Accepted")}
      </span>
    ) : meetup.status === "declined" ? (
      <span className="rounded-full bg-rose/15 px-3 py-1 text-sm font-semibold text-rose ring-1 ring-rose/30">
        {t("Declined")}
      </span>
    ) : meetup.mine ? (
      <span className="rounded-full bg-lemon/15 px-3 py-1 text-sm font-semibold text-lemon ring-1 ring-lemon/30">
        {t("Awaiting reply")}
      </span>
    ) : null;

  return (
    <div
      className={`w-[90%] rounded-2xl bg-ink-soft p-4 ring-1 ring-lemon/35 ${
        meetup.mine ? "self-end" : "self-start"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm uppercase tracking-[0.15em] text-lemon/80">
          {meetup.mine ? t("Your meetup request") : t("{{name}} wants to meet", { name: otherName })}
        </p>
        {statusChip}
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-mx-2 block w-[calc(100%+1rem)] rounded-xl px-2 py-1 text-left transition active:bg-ink"
      >
      {meetup.photoUrl && (
        <img src={meetup.photoUrl} alt="" className="mb-2 max-h-44 w-full rounded-lg object-cover" />
      )}
      <p className="flex items-center gap-2 text-lg font-semibold text-sand">
        <CalendarClock className="size-5 text-lemon" aria-hidden="true" />
        {day} · {time}
      </p>
      <p className="mt-1 flex items-center gap-2 text-base text-mist/85">
        <MapPin className="size-5 text-lemon" aria-hidden="true" />
        {meetup.location}
      </p>
      <p className="mt-1 text-sm font-semibold text-lemon">
        {meetup.lat != null ? t("Tap for details and map") : t("Tap for details")}
      </p>
      </button>
      {meetup.responseNote && (
        <p className="mt-2 rounded-lg bg-ink px-3 py-2 text-base text-mist/85">{meetup.responseNote}</p>
      )}

      {!meetup.mine && meetup.status === "pending" && (
        <div className="mt-3 flex flex-col gap-2">
          {declining && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder={t("Suggest another time (optional)")}
              className="rounded-lg bg-ink px-3 py-2 text-base text-sand ring-1 ring-mist/20 focus:outline-none"
            />
          )}
          <div className="flex gap-2">
            {!declining && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void answer(true)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-tone-emerald/25 px-4 py-3 text-base font-semibold text-sand ring-1 ring-tone-emerald/55 disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
                {t("Accept")}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => (declining ? void answer(false) : setDeclining(true))}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-base font-semibold text-sand ring-1 ring-mist/30 disabled:opacity-60"
            >
              <X className="size-5" />
              {declining ? t("Send decline") : t("Decline")}
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-rose">{error}</p>}
      {open && (
        <MeetupDetailsSheet meetup={{ ...meetup, otherName }} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
