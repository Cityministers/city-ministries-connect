import { createFileRoute, Link } from "@tanstack/react-router";
import { HandHeart, HeartHandshake, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AccountMenu } from "@/components/AccountMenu";
import { LanguagePicker } from "@/components/LanguagePicker";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteNav } from "@/components/SiteNav";
import cityMap from "@/assets/city-map.jpg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ministries, ministryScriptures, toneStyles } from "@/data/ministries";
import { youVersionUrl } from "@/lib/bible";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "City Ministers — Serve your neighbors where you live" },
      {
        name: "description",
        content:
          "City Ministers puts everyday ministry on your city's map. Offer a coffee chat, a ride, a haircut or prayer — or post a need and let neighbors answer it.",
      },
      {
        property: "og:title",
        content: "City Ministers — Serve your neighbors where you live",
      },
      {
        property: "og:description",
        content:
          "Find ministries near you, start your own, post a need, and message the people around you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const samplePinPositions = [
  "left-[18%] top-[28%]",
  "left-[55%] top-[42%]",
  "left-[34%] top-[62%]",
] as const;

const sections = [
  {
    icon: MapPin,
    title: "See ministries on your city's map",
    body: "Search any city or ZIP code and tap the pins to read what your neighbors are offering — a coffee chat, a ride across town, free clothes, prayer, yard help and more. Prefer reading? Switch to the list view.",
  },
  {
    icon: HandHeart,
    title: "Start your own ministry",
    body: "Choose from ready-made ministry types or create something only you can offer. Add a short title, a description, photos or a video, and the city you serve. Your pin goes on the map right away.",
  },
  {
    icon: HeartHandshake,
    title: "Post a need, or answer one",
    body: "Anyone with a need can post it — groceries, a ride, babysitting, prayer. Needs live on their own map and list so neighbors nearby can step in.",
  },
  {
    icon: Sparkles,
    title: "Not sure what to offer?",
    body: "Our guided walkthrough asks about your gifts, heart, abilities, personality and life experience, then suggests ministries that fit you and your family.",
  },
  {
    icon: MessageCircle,
    title: "Message, save and keep track",
    body: "Send a private note to any poster, set a time to meet, save the posts you care about, and see everything — your posts, inbox, favorites and alerts — on your profile.",
  },
] as const;

function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <SiteNav />
            <BrandLogo />
          </div>
          <div />
          <div className="flex items-center justify-end gap-2">
            <LanguagePicker />
            <AccountMenu />
          </div>
        </div>
      </header>


      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
          {t("Ministry happens on your street.")}
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-mist/85 sm:text-2xl">
          {t("City Ministers is a neighborhood map of everyday ministry opportunities. People post their spiritual or practical gifts to share, or the needs they carry, then message each other directly to share the love of Christ — no committee, no building, just neighbors.")}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            to="/map"
            className="inline-flex flex-1 items-center justify-center rounded-full bg-lemon px-8 py-3.5 text-2xl font-bold text-ink transition-transform hover:-translate-y-0.5 sm:flex-initial"
          >
            {t("See the map")}
          </Link>
          <Link
            to="/post-prayer"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-lighter bg-slate px-6 py-3.5 text-xl font-semibold text-sand shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] transition hover:bg-slate-light active:translate-y-0.5 sm:flex-initial"
          >
            {t("Post a Prayer")}
          </Link>
          <Link
            to="/start"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-lighter bg-slate px-6 py-3.5 text-xl font-semibold text-sand shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] transition hover:bg-slate-light active:translate-y-0.5 sm:flex-initial"
          >
            {t("Start Your Ministry")}
          </Link>
          <Link
            to="/post-need"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-lighter bg-slate px-6 py-3.5 text-xl font-semibold text-sand shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] transition hover:bg-slate-light active:translate-y-0.5 sm:flex-initial"
          >
            {t("Post a Need")}
          </Link>
          <Link
            to="/needs"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-lighter bg-slate px-6 py-3.5 text-xl font-semibold text-sand shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] transition hover:bg-slate-light active:translate-y-0.5 sm:flex-initial"
          >
            {t("View Needs")}
          </Link>
        </div>

        <section className="mt-8" aria-labelledby="ministry-preview-heading">
          <h2
            id="ministry-preview-heading"
            className="font-display text-3xl font-semibold sm:text-4xl"
          >
            {t("Ways to minister")}
          </h2>

          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
            {ministries.map((ministry) => (
              <li key={ministry.id}>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-ink-soft/55 p-3 text-center ring-1 ring-mist/15 transition hover:-translate-y-0.5 hover:bg-ink-soft hover:ring-mist/30"
                      aria-label={t("Learn about {{label}}", { label: ministry.label })}
                    >
                      <span
                        className={`grid size-12 place-items-center rounded-lg ring-1 ${toneStyles[ministry.tone]}`}
                      >
                        <ministry.icon className="size-6" aria-hidden="true" />
                      </span>
                      <span className="text-base font-semibold leading-tight text-sand">
                        {t(ministry.label)}
                      </span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[85dvh] overflow-y-auto border-mist/20 bg-ink text-sand sm:rounded-2xl">
                    <DialogHeader>
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid size-12 shrink-0 place-items-center rounded-lg ring-1 ${toneStyles[ministry.tone]}`}
                        >
                          <ministry.icon className="size-6" aria-hidden="true" />
                        </span>
                        <DialogTitle className="font-display text-2xl font-semibold text-sand sm:text-3xl">
                          {t(ministry.label)}
                        </DialogTitle>
                      </div>
                    </DialogHeader>
                    <p className="text-lg leading-relaxed text-mist/85 sm:text-xl">
                      {t(ministry.description)}
                    </p>
                    <div className="flex flex-col gap-3 border-t border-mist/15 pt-4">
                      {(ministryScriptures[ministry.id] ?? []).map((s) => (
                        <p
                          key={s.reference}
                          className="text-lg italic leading-relaxed text-mist/90 sm:text-xl"
                        >
                          “{t(s.text)}”
                          <span className="ml-1.5 whitespace-nowrap font-medium not-italic text-mist/70">
                            — {s.reference}, ESV
                          </span>
                        </p>
                      ))}
                    </div>
                    <a
                      href={youVersionUrl(
                        ministryScriptures[ministry.id]?.[0]?.reference ??
                          ministry.label,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-youversion px-5 py-3 text-base font-semibold text-white transition-transform hover:-translate-y-0.5 sm:w-auto sm:self-start sm:px-6 sm:text-lg"
                    >
                      {t("Read in context on YouVersion")}
                    </a>
                    <Link
                      to="/create-ministry"
                      search={{
                        short: ministry.label,
                        desc: ministry.description,
                        icon: ministry.id,
                      }}
                      className="inline-flex w-full items-center justify-center rounded-full bg-lemon px-6 py-3 text-xl font-bold text-ink transition-transform hover:-translate-y-0.5 sm:w-auto sm:self-start"
                    >
                      {t("Start this ministry")}
                    </Link>
                  </DialogContent>
                </Dialog>
              </li>
            ))}
          </ul>
        </section>

        <ul className="mt-10 flex flex-col gap-4">
          {sections.map((s) => (
            <li
              key={s.title}
              className="flex flex-col gap-4 rounded-2xl bg-ink-soft/45 p-5 ring-1 ring-mist/15"
            >
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-lemon ring-1 ring-mist/20">
                  <s.icon className="size-6" aria-hidden="true" />
                </span>
                <h2 className="font-display text-xl font-semibold sm:text-2xl">
                  {t(s.title)}
                </h2>
              </div>
              <p className="text-xl leading-relaxed text-mist/80 sm:text-2xl">
                {t(s.body)}
              </p>
              {s.title === "Start your own ministry" && (
                <Link
                  to="/start"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-lighter bg-slate px-5 py-2.5 text-lg font-semibold text-sand shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] transition hover:bg-slate-light active:translate-y-0.5 sm:w-auto sm:self-start"
                >
                  {t("Start your ministry")}
                </Link>
              )}
              {s.title === "Post a need, or answer one" && (
                <Link
                  to="/post-need"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-lighter bg-slate px-5 py-2.5 text-lg font-semibold text-sand shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] transition hover:bg-slate-light active:translate-y-0.5 sm:w-auto sm:self-start"
                >
                  {t("Post a Need")}
                </Link>
              )}
              {s.title === "Not sure what to offer?" && (
                <Link
                  to="/gifts"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-lighter bg-slate px-5 py-2.5 text-lg font-semibold text-sand shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] transition hover:bg-slate-light active:translate-y-0.5 sm:w-auto sm:self-start"
                >
                  {t("Explore Your Spiritual Gifts")}
                </Link>
              )}

              {s.title === "See ministries on your city's map" && (
                <Link
                  to="/map"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-lighter bg-slate px-5 py-2.5 text-lg font-semibold text-sand shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] transition hover:bg-slate-light active:translate-y-0.5 sm:w-auto sm:self-start"
                >
                  {t("See Map")}
                </Link>
              )}
              {s.title === "See ministries on your city's map" && (
                <div className="relative h-44 overflow-hidden rounded-xl ring-1 ring-mist/15 sm:h-56">
                  <img
                    src={cityMap}
                    alt={t("Sample city map showing ministry locations")}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-ink/25" />
                  {ministries.slice(0, 3).map((ministry, i) => (
                    <div
                      key={ministry.id}
                      className={`pin-drop absolute ${samplePinPositions[i]}`}
                      style={{ animationDelay: `${150 + i * 120}ms` }}
                    >
                      <div
                        className={`grid size-11 place-items-center rounded-xl ring-1 shadow-[0_8px_20px_-6px_rgba(0,0,0,.8)] sm:size-14 ${toneStyles[ministry.tone]}`}
                      >
                        <ministry.icon className="size-5 sm:size-6" aria-hidden="true" />
                      </div>
                      <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/90 px-2 py-0.5 text-xs font-medium uppercase tracking-[0.15em] text-sand ring-1 ring-mist/20">
                        {t(ministry.label)}
                  </span>
                    </div>
                  ))}
                </div>
              )}
              {s.title === "See ministries on your city's map" && (
                <p className="text-center text-lg italic text-mist/80 sm:text-xl">
                  {t("For this reason I remind you to fan into flame the gift of God, which is in you…")}
                  <span className="ml-1.5 font-medium not-italic text-mist/60">— 2 Timothy 1:6, ESV</span>
                </p>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-2xl bg-ink-soft/45 p-6 text-center ring-1 ring-mist/15">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            {t("Ready to put your gift on the map?")}
          </h2>
          <p className="mt-2 text-lg text-mist/80 sm:text-xl">
            {t("It takes a couple of minutes — a short title, a few words, and your city.")}
          </p>
          <Link
            to="/start"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-lemon px-8 py-3.5 text-2xl font-bold text-ink transition-transform hover:-translate-y-0.5 sm:w-auto"
          >
            {t("Start Your Ministry")}
          </Link>
          <p className="mt-4 text-lg italic text-mist/80 sm:text-xl">
            {t("And they devoted themselves to the apostles' teaching and the fellowship, to the breaking of bread and the prayers.")}
            <span className="ml-1.5 font-medium not-italic text-mist/60">— Acts 2:42, ESV</span>
          </p>
        </div>
      </main>
    </div>
  );
}
