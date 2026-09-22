import { CalendarClock, Check, MapPin, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MeetupDTO } from "@/lib/meetups.functions";
import { MeetupDetailsSheet } from "@/components/meetup/MeetupDetailsSheet";
import { MeetupRespondDialog, type RespondIntent } from "@/components/meetup/MeetupRespondDialog";

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
  const [intent, setIntent] = useState<RespondIntent | null>(null);
  const [open, setOpen] = useState(false);

  const when = new Date(meetup.meetAt);
  const day = when.toLocaleDateString(i18n.language, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const time = when.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" });

  const statusChip =
    meetup.status === "accepted" ? (
      <span className="whitespace-nowrap rounded-full bg-tone-emerald/20 px-3 py-1 text-sm font-semibold text-tone-emerald ring-1 ring-tone-emerald/40">
        {t("Accepted")}
      </span>
    ) : meetup.status === "declined" ? (
      <span className="whitespace-nowrap rounded-full bg-rose/15 px-3 py-1 text-sm font-semibold text-rose ring-1 ring-rose/30">
        {t("Declined")}
      </span>
    ) : meetup.mine ? (
      <span className="whitespace-nowrap rounded-full bg-lemon/15 px-3 py-1 text-sm font-semibold text-lemon ring-1 ring-lemon/30">
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
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setIntent("accept")} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-tone-emerald/25 px-3 py-3 text-base font-semibold text-sand ring-1 ring-tone-emerald/55">
            <Check className="size-5" />
            {t("Accept")}
          </button>
          <button type="button" onClick={() => setIntent("later")} className="flex-1 whitespace-nowrap rounded-full bg-lemon/15 px-3 py-3 text-sm font-semibold text-sand ring-1 ring-lemon/45">
            {t("Maybe later")}
          </button>
          <button type="button" onClick={() => setIntent("decline")} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-ink px-3 py-3 text-base font-semibold text-sand ring-1 ring-mist/30">
            <X className="size-5" />
            {t("Decline")}
          </button>
        </div>
      )}
      {intent && (
        <MeetupRespondDialog meetup={meetup} otherName={otherName} intent={intent} onClose={() => setIntent(null)} onDone={onChanged} />
      )}
      {open && (
        <MeetupDetailsSheet meetup={{ ...meetup, otherName }} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
