import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  HeartHandshake,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/recommendations-demo")({
  component: RecommendationsDemo,
  head: () => ({
    meta: [
      { title: "Ministry Recommendations Preview | City Ministers" },
      {
        name: "description",
        content:
          "A sample of the ministry ideas, people and posts City Ministers recommends after the Spiritual Gifts walkthrough.",
      },
      { property: "og:title", content: "Ministry Recommendations Preview | City Ministers" },
      {
        property: "og:description",
        content:
          "See how City Ministers turns your spiritual gifts into ministry ideas, neighbors to meet and posts to view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Idea = {
  shortTitle: string;
  title: string;
  description: string;
  whyItFits: string;
  kind: "ministry" | "need";
  familyFriendly?: boolean;
};

const IDEAS: Idea[] = [
  {
    shortTitle: "Saturday Table",
    title: "\u201cWhen you give a banquet, invite the poor\u201d \u2014 Luke 14:13",
    description:
      "Open your driveway one Saturday a month for a simple meal. Neighbors bring what they can, you bring the table, the coffee and the welcome. No program, no sign-up \u2014 just a place where the block eats together and nobody sits alone.",
    whyItFits:
      "You marked hospitality and encouragement as gifts, cooking as a skill, and lonely neighbors as what stirs you most.",
    kind: "ministry",
    familyFriendly: true,
  },
  {
    shortTitle: "Rides to Church",
    title: "\u201cCarry each other\u2019s burdens\u201d \u2014 Galatians 6:2",
    description:
      "Offer two seats in your car on Sunday mornings for older neighbors who can no longer drive. Pick up, sit together, drop off \u2014 and check in midweek by phone.",
    whyItFits:
      "You have a vehicle to share, weekend mornings free, and you chose seniors and caregiving as the people on your heart.",
    kind: "ministry",
  },
  {
    shortTitle: "After-School Tutor",
    title: "\u201cTrain up a child in the way he should go\u201d \u2014 Proverbs 22:6",
    description:
      "One hour on Tuesdays helping two kids with reading and math at the library near your ZIP code. Parents stay, homework gets done, and the family knows someone in the neighborhood is for them.",
    whyItFits:
      "Teaching showed up in your gifts, you served in a school before, and your family wants to serve alongside you.",
    kind: "ministry",
    familyFriendly: true,
  },
  {
    shortTitle: "Need: Van Driver",
    title: "Looking for one driver to share the Saturday route",
    description:
      "The meal run needs a second driver so it can keep going twice a month. If you have a van or truck and two free hours, this is the gap.",
    whyItFits:
      "You told us transportation is your biggest barrier \u2014 posting it as a need lets a neighbor fill it.",
    kind: "need",
  },
];

const PEOPLE = [
  {
    name: "Maria Delgado",
    city: "Beaverton, OR",
    reason:
      "Shares your gifts of hospitality and mercy, cooks for her block already, and lives 1.2 miles away.",
  },
  {
    name: "Andre Whitfield",
    city: "Portland, OR",
    reason:
      "Runs a Saturday meal at his church and is looking for someone with your encouragement gift to co-lead.",
  },
  {
    name: "The Okonkwo Family",
    city: "Hillsboro, OR",
    reason:
      "Also marked family-friendly serving and after-school tutoring \u2014 a natural pair for your Tuesday hour.",
  },
];

const POSTS = [
  {
    kind: "need" as const,
    title: "Warm coats for 14 kids before the cold hits",
    city: "Portland, OR",
    description:
      "Our apartment building has fourteen children under twelve without winter coats. Sizes 4 through 12. Drop-off any evening.",
    reason: "Matches the clothing and supplies you said you could share.",
  },
  {
    kind: "ministry" as const,
    title: "Front-porch prayer, every Thursday at 7",
    city: "Beaverton, OR",
    description:
      "Anyone can come sit on the porch, say a name out loud, and be prayed for. Coffee is on. Twenty minutes, then you go home.",
    reason: "Close to you and built on the intercession gift you selected.",
  },
  {
    kind: "need" as const,
    title: "Ride needed to dialysis, Mondays and Fridays",
    city: "Aloha, OR",
    description:
      "My mother needs a ride across town twice a week. Two hours each trip, gas covered.",
    reason: "You have a vehicle free on weekday mornings.",
  },
];

const TABS = [
  { id: "ideas", label: "Your ministry ideas" },
  { id: "people", label: "People you should meet" },
  { id: "posts", label: "Posts you should view" },
] as const;

function RecommendationsDemo() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("ideas");

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-4">
          <Link
            to="/"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-tight text-sand">
              Your ministry matches
            </h1>
            <p className="text-xs text-mist/60">Built from your spiritual gifts and answers</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold ring-1 transition ${
                tab === item.id
                  ? "bg-lemon text-ink ring-lemon"
                  : "bg-ink-soft text-sand ring-mist/25"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "ideas" && (
          <ul className="flex flex-col gap-4">
            {IDEAS.map((idea) => (
              <li
                key={idea.shortTitle}
                className="rounded-2xl bg-ink-soft/60 p-5 ring-1 ring-mist/15"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-lemon/15 px-2.5 py-1 text-sm font-semibold text-lemon">
                    {idea.shortTitle}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-2.5 py-1 text-sm text-mist/80 ring-1 ring-mist/20">
                    <HeartHandshake className="size-4" aria-hidden="true" />
                    {idea.kind === "need" ? "A need" : "A ministry"}
                  </span>
                  {idea.familyFriendly && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-2.5 py-1 text-sm text-mist/80 ring-1 ring-mist/20">
                      <Users className="size-4" aria-hidden="true" /> Family friendly
                    </span>
                  )}
                </div>
                <h2 className="font-display text-xl font-semibold text-sand">{idea.title}</h2>
                <p className="mt-2 text-base leading-relaxed text-mist/80">{idea.description}</p>
                <p className="mt-3 rounded-xl bg-ink/60 px-4 py-3 text-base text-mist/70">
                  <Sparkles className="mr-2 inline size-4 text-lemon" aria-hidden="true" />
                  {idea.whyItFits}
                </p>
              </li>
            ))}
          </ul>
        )}

        {tab === "people" && (
          <ul className="flex flex-col gap-3">
            {PEOPLE.map((person) => (
              <li
                key={person.name}
                className="flex gap-3 rounded-2xl bg-ink-soft p-4 ring-1 ring-mist/20"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink text-sand">
                  <Users className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-sand">{person.name}</p>
                  <p className="text-xs text-mist/60">{person.city}</p>
                  <p className="mt-1 text-sm leading-relaxed text-mist/85">{person.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "posts" && (
          <ul className="flex flex-col gap-3">
            {POSTS.map((post) => (
              <li key={post.title} className="rounded-2xl bg-ink-soft p-4 ring-1 ring-mist/20">
                <span className="text-xs font-semibold uppercase tracking-widest text-lemon">
                  {post.kind === "need" ? "Need" : "Ministry"}
                </span>
                <p className="font-display text-lg font-semibold text-sand">{post.title}</p>
                <p className="flex items-center gap-1 text-xs text-mist/60">
                  <MapPin className="size-3" aria-hidden="true" />
                  {post.city}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-mist/85">{post.description}</p>
                <p className="mt-2 text-sm text-mist/70">{post.reason}</p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-center text-xs text-mist/45">
          Sample matches shown for preview and promotion.
        </p>
      </main>
    </div>
  );
}
