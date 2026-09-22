import { Link } from "@tanstack/react-router";
import { CalendarClock, MapPin, MessageCircle, Navigation, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export type MeetupDetails = {
  id: string;
  meetAt: string;
  location: string;
  lat: number | null;
  lng: number | null;
  status: "pending" | "accepted" | "declined";
  otherName: string;
  conversationId?: string;
};

export function directionsUrl(m: Pick<MeetupDetails, "lat" | "lng" | "location">) {
  const q = m.lat != null && m.lng != null ? `${m.lat},${m.lng}` : m.location;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function staticMap(lat: number, lng: number) {
  const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as string | undefined;
  if (!key) return null;
  const style = [
    "style=element:geometry|color:0x1b1726",
    "style=element:labels.text.fill|color:0x8b8aa3",
    "style=feature:road|element:geometry|color:0x2c2640",
    "style=feature:water|color:0x0e0c16",
  ].join("&");
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=640x320&scale=2&markers=color:0xf2c14e|${lat},${lng}&${style}&key=${key}`;
}

/** Full meetup details with a pressable map that opens directions. */
export function MeetupDetailsSheet({ meetup, onClose }: { meetup: MeetupDetails; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const when = new Date(meetup.meetAt);
  const img = meetup.lat != null && meetup.lng != null ? staticMap(meetup.lat, meetup.lng) : null;
  const status =
    meetup.status === "accepted" ? t("Accepted") : meetup.status === "declined" ? t("Declined") : t("Awaiting reply");

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/80 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("Meetup details")}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-2xl bg-ink-soft p-5 ring-1 ring-mist/25 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.15em] text-lemon/80">{status}</p>
            <h2 className="font-display text-2xl text-sand">
              {t("Meetup with {{name}}", { name: meetup.otherName })}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close")}
            className="grid size-11 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/25"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="flex items-center gap-3 text-lg font-semibold text-sand">
          <CalendarClock className="size-6 text-lemon" />
          {when.toLocaleDateString(i18n.language, { weekday: "long", month: "long", day: "numeric" })} ·{" "}
          {when.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" })}
        </p>
        <p className="flex items-center gap-3 text-lg text-mist/90">
          <MapPin className="size-6 text-lemon" />
          {meetup.location}
        </p>
        <a
          href={directionsUrl(meetup)}
          target="_blank"
          rel="noreferrer"
          className="group relative block overflow-hidden rounded-xl ring-1 ring-lemon/40"
        >
          {img ? (
            <img src={img} alt={t("Map of the meetup spot")} className="h-48 w-full object-cover" />
          ) : (
            <div className="grid h-32 place-items-center bg-ink text-mist/70">
              <MapPin className="size-8 text-lemon" />
            </div>
          )}
          <span className="absolute inset-x-3 bottom-3 inline-flex items-center justify-center gap-2 rounded-full bg-ink/90 px-4 py-2.5 text-base font-semibold text-sand ring-1 ring-lemon/50">
            <Navigation className="size-5 text-lemon" />
            {t("Open in Maps for directions")}
          </span>
        </a>
        {meetup.conversationId && (
          <Link
            to="/messages/$conversationId"
            params={{ conversationId: meetup.conversationId }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-base font-semibold text-sand ring-1 ring-mist/30"
          >
            <MessageCircle className="size-5" />
            {t("Open conversation")}
          </Link>
        )}
      </div>
    </div>
  );
}
