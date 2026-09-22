import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, Loader2, MapPin, Navigation } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { listMyMeetups, respondToMeetup, type MyMeetupDTO } from "@/lib/meetups.functions";
import { MeetupDetailsSheet, directionsUrl } from "@/components/meetup/MeetupDetailsSheet";
import { MeetupsCalendar, dayKey } from "@/components/meetup/MeetupsCalendar";

const MeetupsMap = lazy(() => import("@/components/meetup/MeetupsMap"));

export const Route = createFileRoute("/_authenticated/meetups")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "My Meetups — City Ministers" },
      { name: "description", content: "Your upcoming meetups, times, places and map pins." },
      { property: "og:title", content: "My Meetups — City Ministers" },
      { property: "og:description", content: "Your upcoming meetups, times, places and map pins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeetupsPage,
});

function MeetupsPage() {
  const { t, i18n } = useTranslation();
  const { id } = Route.useSearch();
  const fetchMeetups = useServerFn(listMyMeetups);
  const { data, isLoading } = useQuery({ queryKey: ["my-meetups"], queryFn: () => fetchMeetups() });
  const [openId, setOpenId] = useState<string | null>(id ?? null);
  const [day, setDay] = useState<string | null>(null);
  const list = data ?? [];
  const now = Date.now();
  const upcoming = list.filter((m) => new Date(m.meetAt).getTime() >= now - 3600_000);
  const past = list.filter((m) => new Date(m.meetAt).getTime() < now - 3600_000).reverse();
  const pins = useMemo(
    () => upcoming.filter((m) => m.status === "accepted" && m.lat != null && m.lng != null),
    [upcoming],
  );
  const open = list.find((m) => m.id === openId);

  const row = (m: MyMeetupDTO) => {
    const when = new Date(m.meetAt);
    return (
      <div
        key={m.id}
        className="flex w-full flex-col gap-2 rounded-2xl bg-ink-soft p-4 ring-1 ring-mist/35"
      >
        <button
          type="button"
          onClick={() => setOpenId(m.id)}
          className="flex flex-col gap-1 rounded-xl text-left transition active:scale-[0.99] active:opacity-80"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-semibold text-sand">{m.otherName}</p>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${
                m.status === "accepted"
                  ? "bg-tone-emerald/20 text-tone-emerald ring-tone-emerald/40"
                  : m.status === "declined" ? "bg-ink text-mist/80 ring-mist/40" : "bg-lemon/15 text-lemon ring-lemon/30"
              }`}
            >
              {m.status === "accepted" ? t("Accepted") : m.status === "declined" ? t("Declined") : t("Awaiting reply")}
            </span>
          </div>
          <p className="flex items-center gap-2 text-base text-sand">
            <CalendarClock className="size-5 text-lemon" />
            {when.toLocaleDateString(i18n.language, { weekday: "short", month: "short", day: "numeric" })} ·{" "}
            {when.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" })}
          </p>
          <p className="flex items-center gap-2 text-base text-mist/85">
            <MapPin className="size-5 text-lemon" />
            {m.location}
          </p>
        </button>
        <a
          href={directionsUrl(m)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-base font-semibold text-sand ring-1 ring-lemon/50 transition active:opacity-80"
        >
          <Navigation className="size-5 text-lemon" />
          {t("Open in Maps")}
        </a>
        <RespondRow meetup={m} />
      </div>
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <Link to="/profile" search={{ tab: "notifications" }} className="inline-flex items-center gap-2 text-base text-mist/80">
        <ArrowLeft className="size-5" /> {t("Back to profile")}
      </Link>
      <h1 className="font-display text-3xl text-sand">{t("My meetups")}</h1>

      <MeetupsCalendar meetups={list} selected={day} onSelect={setDay} />
      {day && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.15em] text-lemon/80">{t("On this day")}</h2>
            <button type="button" onClick={() => setDay(null)} className="text-base font-semibold text-lemon">
              {t("Show all")}
            </button>
          </div>
          {list.filter((m) => dayKey(new Date(m.meetAt)) === day).map(row)}
        </section>
      )}

      {pins.length > 0 && (
        <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-ink-soft" />}>
          <MeetupsMap meetups={pins} onSelect={setOpenId} />
        </Suspense>
      )}

      {isLoading ? (
        <Loader2 className="mx-auto size-8 animate-spin text-lemon" />
      ) : list.length === 0 ? (
        <p className="rounded-2xl bg-ink-soft p-5 text-center text-base text-mist/80 ring-1 ring-mist/35">
          {t("No meetups yet. Tap “Let's set a time” on any post to plan one.")}
        </p>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm uppercase tracking-[0.15em] text-lemon/80">{t("Upcoming")}</h2>
            {upcoming.length ? upcoming.map(row) : <p className="text-mist/70">{t("Nothing coming up.")}</p>}
          </section>
          {past.length > 0 && (
            <section className="flex flex-col gap-3 opacity-80">
              <h2 className="text-sm uppercase tracking-[0.15em] text-mist/70">{t("Past")}</h2>
              {past.map(row)}
            </section>
          )}
        </>
      )}

      {open && <MeetupDetailsSheet meetup={open} onClose={() => setOpenId(null)} />}
    </main>
  );
}

function RespondRow({ meetup: m }: { meetup: MyMeetupDTO }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const respond = useServerFn(respondToMeetup);
  const [busy, setBusy] = useState(false);
  const [later, setLater] = useState(false);

  if (later)
    return <p className="text-center text-sm text-mist/75">{t("We let them know you'll reply later.")}</p>;

  const go = async (accept: boolean, maybe = false) => {
    setBusy(true);
    try {
      await respond({ data: { id: m.id, accept, later: maybe || undefined } });
      if (maybe) setLater(true);
      else await qc.invalidateQueries({ queryKey: ["my-meetups"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("Something went wrong"));
    } finally {
      setBusy(false);
    }
  };
  const btn = "flex-1 rounded-full px-3 py-2.5 text-base font-semibold ring-1 transition active:scale-95 disabled:opacity-50";
  return (
    <div className="flex gap-2">
      <button type="button" disabled={busy} onClick={() => go(true)} aria-pressed={m.status === "accepted"} className={`${btn} ${m.status === "accepted" ? "ring-2" : ""} bg-tone-emerald/25 text-sand ring-tone-emerald/55`}>
        {t("Accept")}
      </button>
      <button type="button" disabled={busy} onClick={() => go(false, true)} className={`${btn} bg-lemon/15 text-sand ring-lemon/45`}>
        {t("Maybe later")}
      </button>
      <button type="button" disabled={busy} onClick={() => go(false)} aria-pressed={m.status === "declined"} className={`${btn} ${m.status === "declined" ? "ring-2 ring-mist" : ""} bg-ink text-sand ring-mist/40`}>
        {t("Decline")}
      </button>
    </div>
  );
}
