import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Check,
  HandHeart,
  HeartHandshake,
  Home,
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import ReadAloud from "@/components/ReadAloud";
import VoiceAnswer from "@/components/VoiceAnswer";
import {
  emptyAnswers,
  OPTION_SYNONYMS,
  steps,
  type Field,
  type MinistryIdea,
  type ShapeAnswers,
} from "@/data/shape";
import {
  createGiftReference,
  listGiftReferences,
  type GiftReference,
} from "@/lib/gift-references.functions";
import {
  generateMinistrySuggestions,
  getShapeAccess,
  getShapeProfile,
  postSuggestion,
  saveShapeProfile,
} from "@/lib/shape.functions";

const STOP_WORDS = new Set([
  "and",
  "the",
  "with",
  "your",
  "from",
  "that",
  "into",
  "them",
  "they",
  "people",
  "place",
  "other",
]);

/** US state names and abbreviations we can comma-separate from a city. */
const STATE_NAMES = new Set([
  "alabama",
  "alaska",
  "arizona",
  "arkansas",
  "california",
  "colorado",
  "connecticut",
  "delaware",
  "florida",
  "georgia",
  "hawaii",
  "idaho",
  "illinois",
  "indiana",
  "iowa",
  "kansas",
  "kentucky",
  "louisiana",
  "maine",
  "maryland",
  "massachusetts",
  "michigan",
  "minnesota",
  "mississippi",
  "missouri",
  "montana",
  "nebraska",
  "nevada",
  "new hampshire",
  "new jersey",
  "new mexico",
  "new york",
  "north carolina",
  "north dakota",
  "ohio",
  "oklahoma",
  "oregon",
  "pennsylvania",
  "rhode island",
  "south carolina",
  "south dakota",
  "tennessee",
  "texas",
  "utah",
  "vermont",
  "virginia",
  "washington",
  "west virginia",
  "wisconsin",
  "wyoming",
]);
const STATE_ABBREVS = new Set([
  "al",
  "ak",
  "az",
  "ar",
  "ca",
  "co",
  "ct",
  "de",
  "fl",
  "ga",
  "hi",
  "id",
  "il",
  "in",
  "ia",
  "ks",
  "ky",
  "la",
  "me",
  "md",
  "ma",
  "mi",
  "mn",
  "ms",
  "mo",
  "mt",
  "ne",
  "nv",
  "nh",
  "nj",
  "nm",
  "ny",
  "nc",
  "nd",
  "oh",
  "ok",
  "or",
  "pa",
  "ri",
  "sc",
  "sd",
  "tn",
  "tx",
  "ut",
  "vt",
  "va",
  "wa",
  "wv",
  "wi",
  "wy",
]);

/** Insert a comma between a city and trailing state when spoken without one. */
function normalizeCity(city: string): string {
  const cleaned = city.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ");
  if (parts.length < 2) return cleaned;
  const last = parts[parts.length - 1]!.toLowerCase();
  const secondLast = parts[parts.length - 2]!.toLowerCase();
  if (STATE_NAMES.has(`${secondLast} ${last}`)) {
    return `${parts.slice(0, -2).join(" ")}, ${parts[parts.length - 2]} ${parts[parts.length - 1]}`.replace(/^, /, "");
  }
  if (STATE_NAMES.has(last) || STATE_ABBREVS.has(last)) {
    return `${parts.slice(0, -1).join(" ")}, ${parts[parts.length - 1]}`;
  }
  return cleaned;
}

/** Does this spoken answer mention this option? */
function mentions(text: string, option: string): boolean {
  const hay = ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")} `;
  const phrases = [
    ...(OPTION_SYNONYMS[option] ?? []),
    ...option
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w)),
  ];
  return phrases.some((p) => hay.includes(` ${p} `) || hay.includes(`${p} `));
}

/** All choices offered for one multi-select answer key. */
function optionsFor(key: keyof ShapeAnswers): string[] {
  for (const s of steps) {
    for (const f of s.fields) {
      if ((f.kind === "multi" || f.kind === "single") && f.key === key) return f.options;
    }
  }
  return [];
}

/** Pulls "Mia is 7, Noah is 4" style answers into name/age rows. */
function parseChildren(text: string) {
  const out: { name: string; age: string }[] = [];
  const re = /([A-Z][a-z]+)[^0-9]{0,20}?(\d{1,2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null && out.length < 12) {
    out.push({ name: m[1]!, age: m[2]! });
  }
  return out;
}

export const Route = createFileRoute("/shape")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Spiritual Gift Test — City Ministers" },
      {
        name: "description",
        content:
          "Discover your spiritual gifts, heart, abilities, personality, and experiences with the Spiritual Gift Test on City Ministers.",
      },
      { property: "og:title", content: "Spiritual Gift Test — City Ministers" },
      {
        property: "og:description",
        content:
          "Discover your spiritual gifts, heart, abilities, personality, and experiences with the Spiritual Gift Test on City Ministers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShapeGate,
});

function ShapeGate() {
  const checkAccess = useServerFn(getShapeAccess);
  const { data, isLoading } = useQuery({
    queryKey: ["shape-access"],
    queryFn: () => checkAccess(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink px-4 text-sand">
        <Loader2 className="size-8 animate-spin text-lemon" aria-hidden="true" />
        <p className="text-lg text-mist/80">Loading…</p>
      </div>
    );
  }

  if (data?.access !== "full") {
    return <ComingSoon />;
  }

  return <ShapePage />;
}

function ComingSoon() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-4">
          <Link
            to="/"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label="Back to home"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-semibold leading-tight sm:text-2xl">
              Coming Soon
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10 text-center sm:py-16">
        <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-ink-soft/70 ring-1 ring-mist/15">
          <Sparkles className="size-9 text-lemon" aria-hidden="true" />
        </div>
        <h2 className="mt-6 font-display text-3xl font-semibold leading-tight sm:text-4xl">
          Spiritual Gift Test
        </h2>
        <p className="mx-auto mt-4 max-w-md text-xl leading-relaxed text-mist/85 sm:text-2xl">
          We're building a guided walkthrough that helps you discover your spiritual gifts, heart,
          abilities, personality, and experiences — then suggests ministries that fit you and your
          family. Check back soon.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            to="/"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink-soft px-6 py-3.5 text-lg font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft/70 sm:flex-initial"
          >
            <Home className="size-5" aria-hidden="true" />
            Back to home
          </Link>
          <Link
            to="/start"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-lemon px-6 py-3.5 text-lg font-bold text-ink transition-transform hover:-translate-y-0.5 sm:flex-initial"
          >
            <HandHeart className="size-5" aria-hidden="true" />
            Start Your Ministry
          </Link>
          <Link
            to="/map"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink-soft px-6 py-3.5 text-lg font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft/70 sm:flex-initial"
          >
            <MapPin className="size-5" aria-hidden="true" />
            See the map
          </Link>
        </div>
      </main>
    </div>
  );
}

function ShapePage() {
  const navigate = useNavigate();
  const load = useServerFn(getShapeProfile);
  const save = useServerFn(saveShapeProfile);
  const generate = useServerFn(generateMinistrySuggestions);
  const post = useServerFn(postSuggestion);

  const [answers, setAnswers] = useState<ShapeAnswers>(emptyAnswers);
  const [step, setStep] = useState(0);
  const [ideas, setIdeas] = useState<MinistryIdea[] | null>(null);
  const [savedIdeas, setSavedIdeas] = useState<MinistryIdea[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<Record<number, true>>({});
  const [editing, setEditing] = useState<number | null>(null);
  const [postingAll, setPostingAll] = useState(false);

  useEffect(() => {
    let live = true;
    void load()
      .then((res) => {
        if (!live) return;
        if (res.answers) setAnswers({ ...emptyAnswers, ...res.answers });
        if (res.ideas && res.ideas.length > 0) setSavedIdeas(res.ideas);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [load]);

  function set<K extends keyof ShapeAnswers>(key: K, value: ShapeAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggle(
    key: "gifts" | "heart" | "abilities" | "settings" | "experiences",
    value: string,
  ) {
    setAnswers((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  }

  const current = steps[step]!;
  const isLast = step === steps.length - 1;
  const answersRef = useRef(answers);
  answersRef.current = answers;

  /** Turns one spoken answer into the fields for this step. */
  function applyTranscript(text: string) {
    setAnswers((prev) => {
      const nextAnswers: ShapeAnswers = {
        ...prev,
        transcripts: { ...prev.transcripts, [current.id]: text },
      };
      const pick = (options: string[]) => options.filter((o) => mentions(text, o));

      switch (current.id) {
        case "place": {
          const zip = /\b\d{5}\b/.exec(text)?.[0] ?? prev.zip;
          const city = normalizeCity(
            text
              .replace(/\b\d{5}\b/g, "")
              .replace(/[^A-Za-z\s.'-]/g, " ")
              .replace(/\b(i|we|live|in|serve|serving|the|city|of|my|zip|code|is|am)\b/gi, " ")
              .replace(/\s+/g, " ")
              .trim(),
          );
          nextAnswers.zip = zip;
          if (city) nextAnswers.city = city.slice(0, 60);
          break;
        }
        case "about": {
          const name = /\b(?:my name is|i'?m|i am|this is|call me)\s+([A-Za-z][a-z]+)/i.exec(
            text,
          )?.[1];
          if (name) nextAnswers.firstName = name;
          const age = Number(/\b(\d{1,2})\s*(?:years old|year old|yo)\b/i.exec(text)?.[1] ?? NaN);
          if (!Number.isNaN(age)) {
            nextAnswers.ageRange =
              age < 20 ? "Under 20" : age >= 70 ? "70+" : `${Math.floor(age / 10) * 10}s`;
          }
          const marital = ["Single", "Dating", "Engaged", "Married", "Widowed", "Divorced"].find(
            (o) => mentions(text, o),
          );
          if (marital) nextAnswers.marital = marital;
          const hours = Number(/\b(\d{1,2})\s*hours?\b/i.exec(text)?.[1] ?? NaN);
          if (!Number.isNaN(hours)) {
            nextAnswers.timePerMonth =
              hours <= 2
                ? "1-2 hours"
                : hours <= 5
                  ? "3-5 hours"
                  : hours <= 10
                    ? "6-10 hours"
                    : "10+ hours";
          }
          break;
        }
        case "family": {
          const kids = parseChildren(text);
          if (kids.length > 0) nextAnswers.children = kids;
          nextAnswers.household = text.slice(0, 200);
          break;
        }
        case "gifts": {
          const found = pick(optionsFor("gifts"));
          nextAnswers.gifts = Array.from(new Set([...prev.gifts, ...found]));
          nextAnswers.giftsNote = text.slice(0, 600);
          break;
        }
        case "heart": {
          nextAnswers.heart = Array.from(new Set([...prev.heart, ...pick(optionsFor("heart"))]));
          nextAnswers.heartNote = text.slice(0, 600);
          break;
        }
        case "abilities": {
          nextAnswers.abilities = Array.from(
            new Set([...prev.abilities, ...pick(optionsFor("abilities"))]),
          );
          nextAnswers.abilitiesNote = text.slice(0, 600);
          break;
        }
        case "setting": {
          nextAnswers.settings = Array.from(
            new Set([...prev.settings, ...pick(optionsFor("settings"))]),
          );
          break;
        }
        case "experiences": {
          nextAnswers.experiences = Array.from(
            new Set([...prev.experiences, ...pick(optionsFor("experiences"))]),
          );
          nextAnswers.experienceNote = text.slice(0, 800);
          break;
        }
        case "gifts-lean":
        case "personality": {
          const group = current.id === "personality" ? "personality" : "giftLean";
          const picked = { ...prev[group] };
          for (const field of current.fields) {
            if (field.kind !== "pair") continue;
            const hit = field.options.find((o) => mentions(text, o));
            if (hit) picked[field.id] = hit;
          }
          nextAnswers[group] = picked;
          break;
        }
        case "scope": {
          for (const field of current.fields) {
            if (field.kind !== "single") continue;
            const hit = field.options.find((o) => mentions(text, o));
            if (hit) (nextAnswers[field.key] as string) = hit;
          }
          break;
        }
        case "freetalk": {
          nextAnswers.freeTalk = text.slice(0, 8000);
          break;
        }
        default:
          break;
      }
      return nextAnswers;
    });
  }

  async function next() {
    setError(null);
    const latest = answersRef.current;
    if (current.id === "place" && latest.city.trim().length < 2 && latest.zip.trim().length < 4) {
      setError("Record where you'll serve — say your city or ZIP code.");
      return;
    }
    void save({ data: latest }).catch(() => {});
    if (!isLast) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    await runGenerate();
  }

  async function runGenerate() {
    setBusy(true);
    setError(null);
    try {
      const res = await generate({ data: answersRef.current });
      if (res.error) setError(res.error);
      if (res.ideas.length > 0) {
        setIdeas(res.ideas);
        setSavedIdeas(res.ideas);
      }
    } catch {
      setError("Something went wrong generating your ideas. Try again.");
    } finally {
      setBusy(false);
      window.scrollTo({ top: 0 });
    }
  }

  async function postOne(index: number) {
    const idea = ideas?.[index];
    if (!idea || posted[index]) return;
    setError(null);
    try {
      await post({
        data: {
          kind: idea.kind,
          shortTitle: idea.shortTitle,
          title: idea.title,
          description: idea.description,
          city: answers.city,
          zip: answers.zip,
        },
      });
      setPosted((prev) => ({ ...prev, [index]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't post that one. Try again.");
      throw err;
    }
  }

  async function postAll() {
    if (!ideas) return;
    setPostingAll(true);
    try {
      for (let i = 0; i < ideas.length; i += 1) {
        if (!posted[i]) await postOne(i);
      }
    } catch {
      // the first failure already showed a message
    } finally {
      setPostingAll(false);
    }
  }

  function editIdea(index: number, patch: Partial<MinistryIdea>) {
    setIdeas(
      (prev) => prev?.map((idea, i) => (i === index ? { ...idea, ...patch } : idea)) ?? prev,
    );
  }

  function saveAndExit() {
    void save({ data: answersRef.current }).catch(() => {});
    void navigate({ to: "/" });
  }

  if (ideas) {
    const allPosted = ideas.every((_, i) => posted[i]);
    return (
      <Shell title="Ready to post" back={() => setIdeas(null)} onExit={saveAndExit}>
        <p className="mb-4 text-base text-mist/80 sm:text-lg">
          Edit anything, then post the ones you want.
        </p>
        {error && <ErrorNote text={error} />}

        <button
          type="button"
          onClick={() => void postAll()}
          disabled={postingAll || allPosted}
          className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-lg font-semibold text-ink disabled:opacity-60"
        >
          {postingAll ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-5" aria-hidden="true" />
          )}
          {allPosted ? "All posted" : "Post all"}
        </button>

        <ul className="flex flex-col gap-4">
          {ideas.map((idea, i) => (
            <li key={i} className="rounded-2xl bg-ink-soft/60 p-5 ring-1 ring-mist/15">
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

              {editing === i ? (
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-2 text-base text-mist/80">
                    Short title (shows under the pin)
                    <input
                      className={inputClass}
                      value={idea.shortTitle}
                      maxLength={24}
                      onChange={(e) => editIdea(i, { shortTitle: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-base text-mist/80">
                    Quote or passage about your mission
                    <input
                      className={inputClass}
                      value={idea.title}
                      maxLength={90}
                      onChange={(e) => editIdea(i, { title: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-base text-mist/80">
                    Description
                    <textarea
                      className={`${inputClass} min-h-32`}
                      value={idea.description}
                      onChange={(e) => editIdea(i, { description: e.target.value })}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-base font-semibold text-sand ring-1 ring-mist/25"
                  >
                    <Check className="size-4" aria-hidden="true" /> Done editing
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-xl font-semibold text-sand">{idea.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-mist/80">{idea.description}</p>
                  <p className="mt-3 rounded-xl bg-ink/60 px-4 py-3 text-base text-mist/70">
                    <Sparkles className="mr-2 inline size-4 text-lemon" aria-hidden="true" />
                    {idea.whyItFits}
                  </p>
                </>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(editing === i ? null : i)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-base font-semibold text-sand ring-1 ring-mist/25"
                >
                  <Pencil className="size-4" aria-hidden="true" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => void postOne(i).catch(() => {})}
                  disabled={Boolean(posted[i]) || postingAll}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-lemon px-5 py-3.5 text-base font-semibold text-ink disabled:opacity-60"
                >
                  {posted[i] ? (
                    <>
                      <Check className="size-4" aria-hidden="true" /> Posted
                    </>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void navigate({ to: "/map" })}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-soft px-6 py-3.5 text-lg font-semibold text-sand ring-1 ring-mist/25"
          >
            See them on the map
          </button>
          <button
            type="button"
            onClick={() => {
              setPosted({});
              void runGenerate();
            }}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-soft px-6 py-3.5 text-lg font-semibold text-sand ring-1 ring-mist/25 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            Show me different ideas
          </button>
          <button
            type="button"
            onClick={() => setIdeas(null)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-soft px-6 py-3.5 text-lg font-semibold text-sand ring-1 ring-mist/25"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            See form results
          </button>
          <button
            type="button"
            onClick={() => {
              setIdeas(null);
              setPosted({});
              setAnswers(emptyAnswers);
              setStep(0);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-soft px-6 py-3.5 text-lg font-semibold text-sand ring-1 ring-mist/25"
          >
            <RotateCcw className="size-5" aria-hidden="true" />
            Start over
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title={current.title}
      subtitle={`Step ${step + 1} of ${steps.length}`}
      back={step > 0 ? () => setStep((s) => s - 1) : undefined}
      onExit={saveAndExit}
    >
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-ink-soft">
        <div
          className="h-full rounded-full bg-lemon transition-all"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      {savedIdeas && savedIdeas.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setIdeas(savedIdeas);
            window.scrollTo({ top: 0 });
          }}
          className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-soft px-6 py-3.5 text-lg font-semibold text-sand ring-1 ring-mist/25"
        >
          <Sparkles className="size-5 text-lemon" aria-hidden="true" />
          View saved ideas
        </button>
      )}

      {step === 0 && (
        <p className="mb-4 rounded-xl bg-ink-soft/60 px-4 py-3 text-base leading-relaxed text-mist/80 ring-1 ring-mist/15">
          This is optional help: answer a few questions by talking, and we'll write ready-to-post
          ministry ideas for your city. You can skip it anytime and post your own instead.
        </p>
      )}

      <p className="mb-4 text-base leading-relaxed text-mist/75">{current.blurb}</p>

      <div className="mb-6">
        <ReadAloud text={`${current.title}. ${current.blurb} ${current.prompt}`} />
      </div>

      {current.id === "review" ? (
        <Review answers={answers} />
      ) : (
        <div className="flex flex-col gap-6">
          <VoiceAnswer
            label={current.prompt}
            value={answers.transcripts[current.id] ?? ""}
            onText={applyTranscript}
            onNext={next}
            maxSeconds={current.id === "freetalk" ? 300 : 90}
          />
          {current.fields.map((field, i) => (
            <Fragment key={i}>
              <FieldView field={field} answers={answers} set={set} toggle={toggle} />
              {current.id === "gifts" && field.kind === "multi" && field.key === "gifts" && (
                <AskFriends
                  onAddGifts={(gifts) =>
                    set("gifts", Array.from(new Set([...answers.gifts, ...gifts])))
                  }
                />
              )}
            </Fragment>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-5">
          <ErrorNote text={error} />
        </div>
      )}

      <button
        type="button"
        onClick={() => void next()}
        disabled={busy}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-lg font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {isLast ? "Show my ministry ideas" : "Next"}
      </button>

      {!isLast && current.id !== "place" && (
        <button
          type="button"
          onClick={() => setStep((s) => s + 1)}
          className="mt-3 w-full text-base text-mist/60 underline underline-offset-4"
        >
          Skip this one
        </button>
      )}

      {!isLast && current.id !== "place" && (
        <button
          type="button"
          onClick={() => {
            void save({ data: answersRef.current }).catch(() => {});
            void runGenerate();
          }}
          disabled={busy}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-soft px-6 py-3.5 text-base font-semibold text-sand ring-1 ring-mist/25 disabled:opacity-60"
        >
          <Sparkles className="size-5" aria-hidden="true" />
          Skip to my ideas
        </button>
      )}
    </Shell>
  );
}

function Shell({
  title,
  subtitle,
  back,
  onExit,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: (() => void) | undefined;
  onExit?: (() => void) | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-4">
          {back ? (
            <button
              type="button"
              onClick={back}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
              aria-label="Back"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
          ) : onExit ? (
            <button
              type="button"
              onClick={onExit}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
              aria-label="Back"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <Link
              to="/"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
              aria-label="Back"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-semibold leading-tight sm:text-2xl">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-mist/70">{subtitle}</p>}
          </div>
          {onExit ? (
            <button
              type="button"
              onClick={onExit}
              className="shrink-0 rounded-full bg-ink px-4 py-2 text-base font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
            >
              Save &amp; exit
            </button>
          ) : (
            <Link
              to="/"
              className="shrink-0 rounded-full bg-ink px-4 py-2 text-base font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
            >
              Exit
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}

function ErrorNote({ text }: { text: string }) {
  return (
    <p className="rounded-xl bg-rose/15 px-4 py-3 text-base text-rose ring-1 ring-rose/30">
      {text}
    </p>
  );
}

const inputClass =
  "rounded-xl bg-ink-soft px-4 py-3.5 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50";

function FieldView({
  field,
  answers,
  set,
  toggle,
}: {
  field: Field;
  answers: ShapeAnswers;
  set: <K extends keyof ShapeAnswers>(key: K, value: ShapeAnswers[K]) => void;
  toggle: (
    key: "gifts" | "heart" | "abilities" | "settings" | "experiences",
    value: string,
  ) => void;
}) {
  if (field.kind === "children") {
    return (
      <div className="flex flex-col gap-3">
        <span className="text-base text-mist/80">Your children</span>
        {answers.children.map((child, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={`${inputClass} min-w-0 flex-1`}
              value={child.name}
              placeholder="Name"
              onChange={(e) =>
                set(
                  "children",
                  answers.children.map((c, j) => (j === i ? { ...c, name: e.target.value } : c)),
                )
              }
            />
            <input
              className={`${inputClass} w-24`}
              value={child.age}
              placeholder="Age"
              inputMode="numeric"
              onChange={(e) =>
                set(
                  "children",
                  answers.children.map((c, j) => (j === i ? { ...c, age: e.target.value } : c)),
                )
              }
            />
            <button
              type="button"
              aria-label={`Remove child ${i + 1}`}
              onClick={() =>
                set(
                  "children",
                  answers.children.filter((_, j) => j !== i),
                )
              }
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-soft text-mist/70 ring-1 ring-mist/20"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set("children", [...answers.children, { name: "", age: "" }])}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-soft/60 px-4 py-3 text-base font-medium text-sand ring-1 ring-mist/20"
        >
          <Plus className="size-4" aria-hidden="true" /> Add a child
        </button>
      </div>
    );
  }

  if (field.kind === "pair") {
    const value = answers[field.group][field.id] ?? "";
    return (
      <div className="flex flex-col gap-3">
        <span className="text-base text-mist/80">{field.label}</span>
        <div className="grid gap-3 sm:grid-cols-2">
          {field.options.map((opt) => (
            <button
              key={opt}
              type="button"
              aria-pressed={value === opt}
              onClick={() =>
                set(field.group, {
                  ...answers[field.group],
                  [field.id]: value === opt ? "" : opt,
                })
              }
              className={`rounded-2xl px-4 py-4 text-left text-base transition ${
                value === opt
                  ? "bg-ink-soft text-sand ring-2 ring-lemon"
                  : "bg-ink-soft/40 text-mist/80 ring-1 ring-mist/15 hover:bg-ink-soft/70"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (field.kind === "text" || field.kind === "longtext") {
    const value = answers[field.key] as string;
    if (!value.trim()) return null;
    return (
      <div className="flex flex-col gap-2 text-base text-mist/80">
        {field.label}
        <p className="rounded-2xl bg-ink/60 px-4 py-3 text-base leading-relaxed text-sand ring-1 ring-mist/15">
          {value}
        </p>
      </div>
    );
  }

  if (field.kind === "single") {
    const value = answers[field.key] as string;
    return (
      <div className="flex flex-col gap-3">
        <span className="text-base text-mist/80">{field.label}</span>
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => (
            <button
              key={opt}
              type="button"
              aria-pressed={value === opt}
              onClick={() =>
                set(field.key, (value === opt ? "" : opt) as ShapeAnswers[typeof field.key])
              }
              className={`rounded-xl px-4 py-3 text-base transition ${
                value === opt
                  ? "bg-ink-soft text-sand ring-2 ring-lemon"
                  : "bg-ink-soft/40 text-mist/80 ring-1 ring-mist/15 hover:bg-ink-soft/70"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const key = field.key as "gifts" | "heart" | "abilities" | "settings" | "experiences";
  const list = answers[key];
  return (
    <div className="flex flex-col gap-3">
      <span className="text-base text-mist/80">{field.label}</span>
      <div className="flex flex-wrap gap-3">
        {field.options.map((opt) => {
          const on = list.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(key, opt)}
              className={`rounded-xl px-4 py-3.5 text-base font-medium transition-all active:scale-[0.98] ${
                on
                  ? "bg-ink-soft text-sand shadow-[0_0_0_2px_var(--color-lemon)] ring-1 ring-lemon"
                  : "bg-ink-soft/50 text-mist/80 ring-1 ring-mist/40 hover:bg-ink-soft hover:text-sand hover:ring-mist/60"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Review({ answers }: { answers: ShapeAnswers }) {
  const kids = answers.children.filter((c) => c.name.trim() || c.age.trim());
  const rows: Array<[string, string]> = [
    ["Serving in", [answers.city, answers.zip].filter(Boolean).join(" ") || "—"],
    [
      "You",
      [answers.firstName, answers.ageRange, answers.marital].filter(Boolean).join(" · ") || "—",
    ],
    [
      "Family",
      kids.length > 0
        ? kids.map((c) => `${c.name || "Child"}${c.age ? ` (${c.age})` : ""}`).join(", ")
        : "No children listed",
    ],
    ["Spiritual gifts", answers.gifts.join(", ") || "—"],
    ["Heart", answers.heart.join(", ") || "—"],
    ["Abilities", answers.abilities.join(", ") || "—"],
    ["Personality", Object.values(answers.personality).filter(Boolean).join(" · ") || "—"],
    ["Experiences", answers.experiences.join(", ") || "—"],
    [
      "Scope",
      [answers.travel, answers.frequency, answers.groupSize, answers.kidsWelcome]
        .filter(Boolean)
        .join(" · ") || "—",
    ],
  ];

  return (
    <dl className="flex flex-col gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-ink-soft/50 px-4 py-3 ring-1 ring-mist/15">
          <dt className="text-sm uppercase tracking-wider text-mist/60">{label}</dt>
          <dd className="mt-1 text-base leading-relaxed text-sand">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
