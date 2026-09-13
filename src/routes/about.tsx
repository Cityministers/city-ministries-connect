import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Compass, Heart, MapPin, Milestone, Target, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — City Ministers" },
      {
        name: "description",
        content:
          "Our mission, vision and history: City Ministers helps neighbors share their spiritual gifts and meet local needs, one block at a time.",
      },
      { property: "og:title", content: "About Us — City Ministers" },
      {
        property: "og:description",
        content:
          "Learn the mission, vision and story behind City Ministers — neighbors serving neighbors with the gifts God gave them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const history = [
  {
    year: "The spark",
    text: "It started with a simple question in Portland: what if every believer's gift — a car, a haircut, a listening ear — were visible to the neighbors who needed it most?",
  },
  {
    year: "The first pins",
    text: "A handful of friends put their gifts on a map. Coffee chats, rides, and free clothes. Strangers became neighbors, and neighbors became family.",
  },
  {
    year: "Today",
    text: "City Ministers is open to anyone who wants to serve or ask for help — post a ministry, post a need, and meet in real life.",
  },
];

function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/map"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label="Back to map"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-xl font-semibold sm:text-2xl">About Us</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-lemon/10 text-lemon ring-1 ring-lemon/30">
            <Heart className="size-8" aria-hidden="true" />
          </div>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">We are City Ministers</h2>
          <p className="mt-3 text-lg text-mist/80 sm:text-xl">
            A simple way for neighbors to share their gifts and meet each other's needs.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-ink-soft/40 p-6 ring-1 ring-mist/15">
            <Target className="mb-3 size-6 text-lemon" aria-hidden="true" />
            <h3 className="font-display text-2xl font-semibold">Our mission</h3>
            <p className="mt-2 text-lg leading-relaxed text-mist/80">
              To put every believer's gift on the map, so that no need in our city goes unseen and no
              gift goes unused. We exist to turn quiet willingness into a knock on a real door.
            </p>
          </div>
          <div className="rounded-2xl bg-ink-soft/40 p-6 ring-1 ring-mist/15">
            <Compass className="mb-3 size-6 text-lemon" aria-hidden="true" />
            <h3 className="font-display text-2xl font-semibold">Our vision</h3>
            <p className="mt-2 text-lg leading-relaxed text-mist/80">
              A city where help is never more than a few blocks away — where the church is known by
              the streets it serves, and where asking for help is as normal as offering it.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Milestone className="size-6 text-lemon" aria-hidden="true" />
            <h3 className="font-display text-2xl font-semibold">Our history</h3>
          </div>
          <ol className="space-y-3">
            {history.map((item) => (
              <li key={item.year} className="rounded-2xl bg-ink-soft/40 p-5 ring-1 ring-mist/15">
                <p className="font-display text-xl font-semibold text-lemon">{item.year}</p>
                <p className="mt-1.5 text-lg leading-relaxed text-mist/80">{item.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-ink-soft/40 p-5 ring-1 ring-mist/15">
            <Users className="mb-3 size-6 text-lemon" aria-hidden="true" />
            <h3 className="font-display text-xl font-semibold">Share your gift</h3>
            <p className="mt-2 text-lg leading-relaxed text-mist/80">
              Post a ministry — a coffee chat, a ride, free clothes, prayer, or anything God has put on
              your heart.
            </p>
          </div>
          <div className="rounded-2xl bg-ink-soft/40 p-5 ring-1 ring-mist/15">
            <MapPin className="mb-3 size-6 text-lemon" aria-hidden="true" />
            <h3 className="font-display text-xl font-semibold">Find it nearby</h3>
            <p className="mt-2 text-lg leading-relaxed text-mist/80">
              Browse the map or list by city and ZIP. See who's serving right on your street.
            </p>
          </div>
          <div className="rounded-2xl bg-ink-soft/40 p-5 ring-1 ring-mist/15">
            <Heart className="mb-3 size-6 text-lemon" aria-hidden="true" />
            <h3 className="font-display text-xl font-semibold">Meet the need</h3>
            <p className="mt-2 text-lg leading-relaxed text-mist/80">
              Message a neighbor, set a time, and show up with love. Every small act matters.
            </p>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/start"
            className="rounded-full bg-lemon px-6 py-3 text-base font-semibold text-ink transition hover:bg-lemon/90"
          >
            Start your ministry
          </Link>
          <Link
            to="/needs"
            className="rounded-full bg-ink-soft/60 px-6 py-3 text-base font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
          >
            View needs
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-mist/60">
          Built to help the body of Christ serve its city, one block at a time.
        </p>
      </main>
    </div>
  );
}
