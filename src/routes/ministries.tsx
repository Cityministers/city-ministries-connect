import { CountrySelect } from "@/components/CountrySelect";
import { countryCodes } from "@/lib/country";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Map, MapPin, MessageCircle, Search, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MinistryPost } from "@/components/MinistryPost";
import { toneStyles } from "@/data/ministries";
import { listUserMinistries } from "@/lib/ministries.functions";
import { matchesPlace, matchesText } from "@/lib/place";
import { toMinistry } from "@/lib/user-ministries";

export const Route = createFileRoute("/ministries")({
  validateSearch: (search: Record<string, unknown>): { place?: string; country?: string } => {
    const raw = search["place"];
    const place = (
      typeof raw === "string" || typeof raw === "number" ? String(raw) : ""
    ).replace(/^"|"$/g, "");
    return { ...(place.length > 0 ? { place } : {}), ...(typeof search["country"] === "string" && countryCodes.has(search["country"] as string) ? { country: search["country"] as string } : {}) };
  },
  head: () => ({
    meta: [
      { title: "All ministries — City Ministers" },
      {
        name: "description",
        content:
          "Browse every ministry posted near you on City Ministers — meals, rides, prayer, mentoring, music, and more. Tap any listing to meet the person behind it.",
      },
      { property: "og:title", content: "All ministries — City Ministers" },
      {
        property: "og:description",
        content:
          "Browse every ministry posted near you and message the neighbor offering it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MinistriesPage,
});

function MinistriesPage() {
  const { t } = useTranslation();
  const { place, country: searchCountry } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [placeQuery, setPlaceQuery] = useState(place ?? "Portland, OR 97209");
  const [country, setCountry] = useState(searchCountry ?? "US");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchUserMinistries = useServerFn(listUserMinistries);
  const { data: userPosts } = useQuery({
    queryKey: ["user-ministries"],
    queryFn: () => fetchUserMinistries(),
  });

  const all = useMemo(() => (userPosts ?? []).map(toMinistry), [userPosts]);

  const results = useMemo(
    () => all.filter((m) => matchesPlace(m, placeQuery, country) && matchesText(m, query)),
    [all, placeQuery, query, country],
  );

  const active = all.find((m) => m.id === activeId);

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="sticky top-0 z-30 border-b border-ink-soft bg-ink-soft/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/map"
              search={{ place: placeQuery, country }}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
              aria-label={t("Back to map")}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
            <h1 className="font-display text-lg font-semibold sm:text-xl">{t("All ministries")}</h1>
            <Link
              to="/map"
              search={{ place: placeQuery, country }}
              className="ml-auto grid size-9 shrink-0 place-items-center rounded-full bg-tone-cyan/15 text-tone-cyan ring-1 ring-tone-cyan/45 transition hover:bg-tone-cyan/25"
              aria-label={t("Map view")}
            >
              <Map className="size-5" aria-hidden="true" />
            </Link>
          </div>
          <CountrySelect compact value={country} onChange={(value) => { setCountry(value); void navigate({ search: { place: placeQuery, country: value }, replace: true }); }} className="rounded-full bg-ink px-4 py-2.5 text-base text-sand ring-1 ring-mist/20" />
          <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 ring-1 ring-mist/20 focus-within:ring-lemon/50">
            <MapPin className="size-4 shrink-0 text-lemon" aria-hidden="true" />
            <input
              className="w-full min-w-0 bg-transparent text-sm text-sand placeholder:text-mist/50 focus:outline-none"
              type="search"
              value={placeQuery}
              onChange={(e) => {
                setPlaceQuery(e.target.value);
                void navigate({ search: { place: e.target.value, country }, replace: true });
              }}
              placeholder={t("City or postal code")}
              aria-label={t("Search by city or postal code")}
            />
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-mist/40">
              {t("Postal or city")}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 ring-1 ring-mist/20 focus-within:ring-lemon/50">
            <Search className="size-4 shrink-0 text-lemon" aria-hidden="true" />
            <input
              className="w-full min-w-0 bg-transparent text-sm text-sand placeholder:text-mist/50 focus:outline-none"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search ministries, places, people")}
              aria-label={t("Search ministries")}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:px-6">
        <ul className="flex flex-col gap-3">
          {results.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setActiveId(m.id)}
                className="flex w-full items-start gap-3 rounded-2xl bg-ink-soft p-3 text-left ring-1 ring-mist/15 transition hover:ring-mist/35 sm:p-4"
              >
                {m.avatarUrl ? (
                  <span className="size-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-mist/25 sm:size-16">
                    <img
                      src={m.avatarUrl}
                      alt={t("{{label}} — {{name}}", { label: m.label, name: m.poster.name })}
                      className="size-full object-cover"
                    />
                  </span>
                ) : (
                  <span
                    className={`grid size-14 shrink-0 place-items-center rounded-xl ring-1 sm:size-16 ${toneStyles[m.tone]}`}
                  >
                    <m.icon className="size-6 sm:size-7" aria-hidden="true" />
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="font-display text-3xl font-semibold text-sand sm:text-4xl">
                    {t(m.label)}
                  </span>
                  <span className="line-clamp-2 text-lg leading-relaxed text-mist/80 sm:text-xl">
                    {t(m.description)}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-mist/60 sm:text-lg">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4" aria-hidden="true" />
                      {m.neighborhood}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      {m.poster.photo && (
                        <img
                          src={m.poster.photo}
                          alt=""
                          className="size-7 rounded-full object-cover ring-1 ring-mist/25"
                        />
                      )}
                      {m.poster.name}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base sm:text-lg">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-tone-blue/12 px-2.5 py-1.5 text-tone-blue ring-1 ring-tone-blue/35">
                      <ThumbsUp className="size-5" aria-hidden="true" />
                      {m.likes}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-tone-cyan/12 px-2.5 py-1.5 text-tone-cyan ring-1 ring-tone-cyan/35">
                      <MessageCircle className="size-5" aria-hidden="true" />
                      {m.comments}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {results.length === 0 && (
          <p className="py-16 text-center text-sm text-mist/60">
            {t("No ministries in {{place}} match \u201c{{query}}\u201d.", { place: placeQuery || t("your area"), query })}
          </p>
        )}

        {active && <MinistryPost ministry={active} onClose={() => setActiveId(null)} />}
      </main>
    </div>
  );
}
