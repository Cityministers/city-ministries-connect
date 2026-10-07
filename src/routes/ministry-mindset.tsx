import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, HandHeart, HeartHandshake } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteNav } from "@/components/SiteNav";
import { AccountMenu } from "@/components/AccountMenu";
import { youVersionUrl } from "@/lib/bible";
import { useLiveVerseText } from "@/components/ScriptureCard";

export const Route = createFileRoute("/ministry-mindset")({
  head: () => ({
    meta: [
      { title: "Ministry Mindset — City Ministers" },
      {
        name: "description",
        content:
          "A Biblical mindset for ministry — how to give help like Christ gave, and how to receive help without shame. New Testament passages, characters, and wisdom.",
      },
      { property: "og:title", content: "Ministry Mindset — City Ministers" },
      {
        property: "og:description",
        content:
          "How to serve others with Christ's heart, and how to receive help with grace — framed by New Testament teaching.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MinistryMindsetPage,
});

const givingPassages = [
  {
    ref: "Mark 10:45",
    text: "For even the Son of Man came not to be served but to serve, and to give his life as a ransom for many.",
  },
  {
    ref: "Galatians 5:13",
    text: "For you were called to freedom, brothers. Only do not use your freedom as an opportunity for the flesh, but through love serve one another.",
  },
  {
    ref: "1 Peter 4:10",
    text: "As each has received a gift, use it to serve one another, as good stewards of God's varied grace.",
  },
  {
    ref: "Philippians 2:3–4",
    text: "Do nothing from selfish ambition or conceit, but in humility count others more significant than yourselves. Let each of you look not only to his own interests, but also to the interests of others.",
  },
  {
    ref: "2 Corinthians 9:7",
    text: "Each one must give as he has decided in his heart, not reluctantly or under compulsion, for God loves a cheerful giver.",
  },
  {
    ref: "Matthew 23:11",
    text: "You are simply his hands as He dwells within you through the Spirit.",
  },
];


const givingCharacters = [
  {
    name: "The Good Samaritan",
    where: "Luke 10:25–37",
    lesson:
      "He stopped for a stranger others walked past. Ministry begins by seeing a need in front of you and treating a neighbor's pain as your own business.",
  },
  {
    name: "Barnabas, the encourager",
    where: "Acts 4:36–37; 9:26–27",
    lesson:
      "He sold a field to help the poor and stood up for Paul when everyone else was afraid. Sometimes ministry is money; sometimes it is simply vouching for someone.",
  },
  {
    name: "Dorcas (Tabitha)",
    where: "Acts 9:36–42",
    lesson:
      "She was 'full of good works and acts of charity' — she sewed clothes for widows. An ordinary skill, offered faithfully, became a legacy the whole town mourned.",
  },
  {
    name: "The Macedonian churches",
    where: "2 Corinthians 8:1–5",
    lesson:
      "Out of 'extreme poverty' they begged for the chance to give. Generosity is not about having extra — it is about a willing heart.",
  },
];

const receivingPassages = [
  {
    ref: "Galatians 6:2",
    text: "Bear one another's burdens, and so fulfill the law of Christ.",
  },
  {
    ref: "Acts 20:35",
    text: "It is more blessed to give than to receive — but someone must receive for the blessing to happen.",
  },
  {
    ref: "John 13:8–9",
    text: "Peter said to him, 'You shall never wash my feet.' Jesus answered him, 'If I do not wash you, you have no share with me.'",
  },
  {
    ref: "2 Corinthians 12:9",
    text: "But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.' Therefore I will boast all the more gladly of my weaknesses, so that the power of Christ may rest upon me.",
  },
  {
    ref: "James 4:6",
    text: "God opposes the proud but gives grace to the humble.",
  },
];

const receivingCharacters = [
  {
    name: "The woman at the well",
    where: "John 4:1–42",
    lesson:
      "Jesus asked her for a drink first. He received from her before He gave to her — receiving help let her meet Him. Accepting help can be the doorway, not the defeat.",
  },
  {
    name: "Peter's mother-in-law",
    where: "Mark 1:29–31",
    lesson:
      "She let Jesus heal her, then got up and served. Receiving help is often what puts us back on our feet to help the next person.",
  },
  {
    name: "Paul, carried by the churches",
    where: "Philippians 4:15–19",
    lesson:
      "The apostle who planted churches openly received money and care from them. Even the strongest servants in Scripture leaned on their community.",
  },
  {
    name: "The prodigal son",
    where: "Luke 15:11–32",
    lesson:
      "He came home expecting to be a hired servant and was received as a son. When you need help, come honestly — you may be met with more grace than you dared hope.",
  },
];

function Passage({ verse }: { verse: { ref: string; text: string } }) {
  const text = useLiveVerseText(verse.ref, verse.text);
  return (
    <blockquote className="rounded-2xl bg-ink-soft/60 p-5 ring-1 ring-mist/15">
      <p className="text-lg italic leading-relaxed text-sand/90 sm:text-xl">
        “{text}”
      </p>
      <cite className="mt-3 block text-base font-semibold not-italic text-lemon">
        — {verse.ref}, NIV
      </cite>
    </blockquote>
  );
}

function Character({
  person,
}: {
  person: { name: string; where: string; lesson: string };
}) {
  return (
    <div className="rounded-2xl bg-ink-soft/40 p-5 ring-1 ring-mist/10">
      <p className="text-xl font-semibold text-sand">{person.name}</p>
      <p className="mt-1 text-sm font-medium uppercase tracking-[0.15em] text-mist/60">
        {person.where}
      </p>
      <p className="mt-3 text-lg leading-relaxed text-sand/85">
        {person.lesson}
      </p>
    </div>
  );
}

function MinistryMindsetPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-1.5">
            <Link
              to="/"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
              aria-label="Back to home"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
            <SiteNav />
          </div>
          <div className="flex items-center justify-center">
            <BrandLogo />
          </div>
          <div className="flex justify-end">
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-lemon">
          Ministry Mindset
        </p>
        <h1 className="mt-3 text-center font-display text-4xl leading-tight text-sand sm:text-5xl">
          The heart of ministry
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-center text-xl leading-relaxed text-sand/85">
          Every ministry on this map is a small echo of something Jesus
          started: ordinary people loving their neighbors in practical ways.
          Below is the Biblical frame for both sides of that exchange — the
          one who gives help, and the one who receives it.
        </p>

        {/* Giving half */}
        <section className="mt-14">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-tone-emerald/15 text-tone-emerald ring-1 ring-tone-emerald/40">
              <HeartHandshake className="size-6" aria-hidden="true" />
            </span>
            <h2 className="font-display text-3xl text-sand sm:text-4xl">
              When you give help
            </h2>
          </div>
          <p className="mt-5 text-xl leading-relaxed text-sand/85">
            Christ's call is not to admiration but to imitation. He knelt and
            washed feet, touched the untouchable, and fed people before He
            preached to them. The New Testament treats service as the normal
            shape of a believer's life — not a program for the especially
            gifted, but a command for everyone: "through love serve one
            another." Ministry is stewardship: your skills, your time, your
            spare coat, your car seat on Sunday morning are gifts on loan
            from God, meant to circulate.
          </p>
          <p className="mt-4 text-xl leading-relaxed text-sand/85">
            The wisdom of the apostles adds the <em>how</em>: give freely,
            not from guilt or to be seen; give cheerfully, because a
            resentful gift blesses no one; and give humbly, counting the
            person in front of you as more significant than yourself. You are
            not the savior in the story — Christ is. You are simply the
            neighbor who stopped.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {givingPassages.map((p) => (
              <Passage key={p.ref} verse={p} />
            ))}
          </div>
          <a
            href={youVersionUrl("Mark 10:45")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-youversion px-5 py-3 text-base font-semibold text-white transition-transform hover:-translate-y-0.5 sm:w-auto sm:self-start sm:px-6 sm:text-lg"
          >
            Read in context on YouVersion
          </a>
          <h3 className="mt-10 flex items-center gap-2 font-display text-2xl text-sand sm:text-3xl">
            <BookOpen className="size-6 text-lemon" aria-hidden="true" />
            People who show us
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {givingCharacters.map((c) => (
              <Character key={c.name} person={c} />
            ))}
          </div>
          <a
            href={youVersionUrl("Luke 10:25–37")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-youversion px-5 py-3 text-base font-semibold text-white transition-transform hover:-translate-y-0.5 sm:w-auto sm:self-start sm:px-6 sm:text-lg"
          >
            Read in context on YouVersion
          </a>
        </section>

        {/* Receiving half */}
        <section className="mt-16 border-t border-mist/15 pt-14">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-tone-indigo/15 text-tone-indigo ring-1 ring-tone-indigo/40">
              <HandHeart className="size-6" aria-hidden="true" />
            </span>
            <h2 className="font-display text-3xl text-sand sm:text-4xl">
              When you need help
            </h2>
          </div>
          <p className="mt-5 text-xl leading-relaxed text-sand/85">
            Needing help is not failure — it is part of God's design. "Bear
            one another's burdens" is a command with two sides: someone
            carries, and someone is carried. If no one ever received, no one
            could obey Christ's command to serve. When you let a neighbor
            help you, you are not taking something from them; you are giving
            them the chance to be obedient and blessed.
          </p>
          <p className="mt-4 text-xl leading-relaxed text-sand/85">
            The mindset Scripture teaches is humility without shame. Pride
            says "I'll manage alone"; the gospel says grace flows to the
            humble. Even Paul — apostle, preacher, church planter — openly
            depended on others. Come honestly, receive gratefully, and when
            you are back on your feet, look around for the next person whose
            burden you can help carry. That is the whole cycle of the church.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {receivingPassages.map((p) => (
              <Passage key={p.ref} verse={p} />
            ))}
          </div>
          <a
            href={youVersionUrl("Galatians 6:2")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-youversion px-5 py-3 text-base font-semibold text-white transition-transform hover:-translate-y-0.5 sm:w-auto sm:self-start sm:px-6 sm:text-lg"
          >
            Read in context on YouVersion
          </a>
          <h3 className="mt-10 flex items-center gap-2 font-display text-2xl text-sand sm:text-3xl">
            <BookOpen className="size-6 text-lemon" aria-hidden="true" />
            People who show us
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {receivingCharacters.map((c) => (
              <Character key={c.name} person={c} />
            ))}
          </div>
          <a
            href={youVersionUrl("Luke 15:11–32")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-youversion px-5 py-3 text-base font-semibold text-white transition-transform hover:-translate-y-0.5 sm:w-auto sm:self-start sm:px-6 sm:text-lg"
          >
            Read in context on YouVersion
          </a>
        </section>

        <div className="mt-16 flex flex-col items-center gap-3 rounded-3xl bg-ink-soft/50 p-8 text-center ring-1 ring-mist/15">
          <p className="text-xl leading-relaxed text-sand/90">
            Ready to put it into practice?
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/start"
              className="inline-flex items-center justify-center rounded-full bg-lemon px-8 py-3.5 text-lg font-bold text-ink transition-transform hover:-translate-y-0.5"
            >
              Start Your Ministry
            </Link>
            <Link
              to="/post-need"
              className="inline-flex items-center justify-center rounded-full bg-tone-indigo/15 px-8 py-3.5 text-lg font-semibold text-sand ring-1 ring-tone-indigo/45 transition hover:bg-tone-indigo/25"
            >
              Post a Need
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
