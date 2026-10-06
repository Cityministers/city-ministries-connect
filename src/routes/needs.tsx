import { CountrySelect } from "@/components/CountrySelect";
import { countryCodes, defaultCountry } from "@/lib/country";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  HandHelping,
  List,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Search,
  ThumbsUp,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LiveMap, type MapBounds } from "@/components/LiveMap";
import { useHomePoint, useMapPosts, usePlaceCenter } from "@/lib/use-map-view";
import { MinistryPost } from "@/components/MinistryPost";
import { Button } from "@/components/ui/button";
import { toneStyles } from "@/data/ministries";
import { listUserNeeds } from "@/lib/needs.functions";
import { matchesPlace, matchesText } from "@/lib/place";
import { useSession } from "@/hooks/useSession";
import { toNeed } from "@/lib/user-needs";

export const Route = createFileRoute("/needs")({
  validateSearch: (search: Record<string, unknown>): { place?: string; country?: string; view?: string; new?: string } => {
    const raw = search["place"];
    const place = (
      typeof raw === "string" || typeof raw === "number" ? String(raw) : ""
    ).replace(/^"|"$/g, "");
    const rawView = search["view"];
    const view = rawView === "list" ? "list" : "map";
    const fresh = typeof search["new"] === "string" ? search["new"] : "";
    return {
      ...(place.length > 0 ? { place } : {}),
      ...(typeof search["country"] === "string" && countryCodes.has(search["country"] as string) ? { country: search["country"] as string } : {}),
      ...(view === "list" ? { view } : {}),
      ...(fresh.length > 0 ? { new: fresh } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Needs near you — City Ministers" },
      {
        name: "description",
        content:
          "See what neighbors around you need — a ride, groceries, a hand moving — and answer the one you can meet today.",
      },
      { property: "og:title", content: "Needs near you — City Ministers" },
      {
        property: "og:description",
        content: "Browse the needs posted by neighbors in your city and lend a hand.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NeedsPage,
});

function NeedsPage() {
  const { t } = useTranslation();
  const { place, country: searchCountry, view, new: freshId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [placeQuery, setPlaceQuery] = useState(place ?? "Portland, OR 97209");
  const [country, setCountry] = useState(searchCountry ?? "US");
  useEffect(() => {
    if (!searchCountry) setCountry(defaultCountry());
  }, [searchCountry]);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(
    freshId ? `need-${freshId}` : null,
  );
  const isMap = view !== "list";

  // The glow stays until the visitor taps another post — no timer.


  const fetchNeeds = useServerFn(listUserNeeds);
  const { data: needs } = useQuery({
    queryKey: ["user-needs"],
    queryFn: () => fetchNeeds(),
  });

  const all = useMemo(() => (needs ?? []).map(toNeed), [needs]);
  const results = useMemo(
    () => all.filter((m) => matchesPlace(m, placeQuery, country) && matchesText(m, query)),
    [all, placeQuery, query, country],
  );
  // The map keeps every need on it; the place search moves the map instead of filtering.
  const onMap = useMemo(() => all.filter((m) => matchesText(m, query)), [all, query]);
  const center = usePlaceCenter(placeQuery, country);
  const session = useSession();
  const { origin } = useHomePoint(Boolean(session), center);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const { points, list: inViewList } = useMapPosts(
    onMap,
    origin,
    bounds,
    "view",
    session?.user?.id ?? null,
    highlightId,
  );
  const active = all.find((m) => m.id === activeId);

  // A freshly created need sits in the middle of the screen while it glows.
  const spotlight = highlightId ? points.find((p) => p.id === highlightId) : undefined;
  const mapCenter = spotlight ? { lat: spotlight.lat, lng: spotlight.lng } : center;

  function selectPoint(id: string) {
    setActiveId(id);
    if (id !== highlightId) setHighlightId(null);
  }

  const toggleView = () => {
    void navigate({
      search: {
        ...(placeQuery ? { place: placeQuery } : {}),
        country,
        ...(isMap ? { view: "list" as const } : {}),
      },
      replace: true,
    });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="sticky top-0 z-30 border-b border-ink-soft bg-ink-soft/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/map"
              search={{ place: placeQuery }}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
              aria-label={t("Back to map")}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
            <h1 className="font-display text-lg font-semibold sm:text-xl">
              {t("Needs near you")}
              <Link
                to="/needs"
                search={{ ...(placeQuery ? { place: placeQuery } : {}),
        country, view: "list" as const }}
                className="ml-2 inline-flex items-center text-lemon hover:underline"
                aria-label={t("View list of {{count}} needs", { count: results.length })}
              >
                {results.length}
              </Link>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-ink px-4 py-2.5 ring-1 ring-mist/20 focus-within:ring-lemon/50">
              <MapPin className="size-4 shrink-0 text-lemon" aria-hidden="true" />
              <input
                className="w-full min-w-0 bg-transparent text-sm text-sand placeholder:text-mist/50 focus:outline-none"
                type="search"
                value={placeQuery}
                onChange={(e) => {
                  setPlaceQuery(e.target.value);
                  void navigate({
                    search: {
                      ...(e.target.value ? { place: e.target.value, country } : {}),
                      ...(isMap ? {} : { view: "list" as const }),
                    },
                    replace: true,
                  });
                }}
                placeholder={t("City or postal code")}
                aria-label={t("Search by city or postal code")}
              />
              <span className="hidden shrink-0 text-[10px] font-bold uppercase tracking-widest text-mist/60 sm:inline">
                {t("Postal or city")}
              </span>
            </div>
              <CountrySelect compact value={country} onChange={(value) => { setCountry(value); void navigate({ search: { place: placeQuery, country: value, ...(isMap ? {} : { view: "list" as const }) }, replace: true }); }} className="max-w-28 rounded-full bg-ink px-2 py-2.5 text-sm text-sand ring-1 ring-mist/20" />
            <button
              type="button"
              onClick={toggleView}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-tone-cyan/15 text-tone-cyan ring-1 ring-tone-cyan/45 transition hover:bg-tone-cyan/25"
              aria-label={isMap ? t("List view") : t("Map view")}
            >
              {isMap ? (
                <List className="size-4" aria-hidden="true" />
              ) : (
                <MapIcon className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 ring-1 ring-mist/20 focus-within:ring-lemon/50">
            <Search className="size-4 shrink-0 text-lemon" aria-hidden="true" />
            <input
              className="w-full min-w-0 bg-transparent text-sm text-sand placeholder:text-mist/60 focus:outline-none"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search needs, places, people")}
              aria-label={t("Search needs")}
            />
          </div>
          <div className="grid w-full grid-cols-3 gap-2" aria-label={t("Map post controls")}>
            <Button
              asChild
              className="h-10 rounded-full bg-tone-emerald/15 px-2 text-sm font-semibold text-sand shadow-none ring-1 ring-tone-emerald/45 hover:bg-tone-emerald/25 sm:px-5"
            >
              <Link to="/post-need" aria-label={t("Create a need post")}>
                {t("Create Post")}
              </Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-full bg-tone-cyan/15 px-2 text-sm font-semibold text-sand shadow-none ring-1 ring-tone-cyan/45 hover:bg-tone-cyan/25 sm:px-5"
            >
              <Link to="/map" search={{ place: placeQuery }}>
                {t("Ministries")}
              </Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-full bg-tone-indigo/25 px-2 text-sm font-semibold text-sand shadow-none ring-1 ring-tone-indigo/55 hover:bg-tone-indigo/35 sm:px-5"
            >
              <Link
                to="/needs"
                search={{ ...(placeQuery ? { place: placeQuery } : {}) }}
                aria-current="page"
              >
                {t("Needs")}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6">
        {isMap ? (
          <>
            <div className="relative">
              <LiveMap
                points={points}
                center={mapCenter}
                zoom={spotlight ? 16 : 12}
                onSelect={selectPoint}
                onBoundsChange={setBounds}
                label={t("Needs map. Drag to explore other neighborhoods.")}
                className="map-fade h-[60dvh] min-h-[320px] w-full"
              />
            </div>
            <div className="mt-3 grid w-full grid-cols-3 gap-2" aria-label={t("Map layers")}>
              <Button
                asChild
                className="h-10 rounded-full bg-lemon/15 px-2 text-sm font-semibold text-sand shadow-none ring-1 ring-lemon/45 transition hover:bg-lemon/25 sm:px-5"
              >
                <Link to="/map" search={{ ...(placeQuery ? { place: placeQuery } : {}),
        country, mode: "church" }}>
                  {t("Churches")}
                </Link>
              </Button>
              <Button
                asChild
                className="h-10 rounded-full bg-prayer/15 px-2 text-sm font-semibold text-sand shadow-none ring-1 ring-prayer/45 transition hover:bg-prayer/25 sm:px-5"
              >
                <Link to="/map" search={{ ...(placeQuery ? { place: placeQuery } : {}),
        country, mode: "prayer" }}>
                  {t("Prayers")}
                </Link>
              </Button>
              <Button
                asChild
                aria-label={t("Videos")}
                title={t("Videos")}
                className="grid h-10 place-items-center rounded-full bg-video-deep/50 px-2 text-sm font-semibold text-sand shadow-none ring-1 ring-video/40 transition hover:bg-video-deep/75 sm:px-5"
              >
                <Link to="/map" search={{ ...(placeQuery ? { place: placeQuery } : {}),
        country, mode: "video" }}>
                  <span className="grid size-6 place-items-center rounded-md ring-1 ring-video-light/45">
                    <Video className="size-4" aria-hidden="true" strokeWidth={2.25} />
                  </span>
                </Link>
              </Button>
            </div>
            <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-mist/40">
              {t("{{count}} needs in this view", { count: inViewList.length })}
            </p>
            {points.length === 0 && (
              <p className="mt-3 text-center text-sm text-mist/80">{t("No needs posted yet.")}</p>
            )}
          </>
        ) : null}

        <ul className={`flex flex-col gap-3 ${isMap ? "mt-4" : ""}`}>
            {(isMap ? inViewList.map((x) => x.post) : results).map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(m.id);
                    if (m.id !== highlightId) setHighlightId(null);
                  }}
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
                    <span className="flex items-center gap-2">
                      <span className="font-display text-3xl font-semibold text-sand sm:text-4xl">
                        {t(m.label)}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-lg leading-relaxed text-mist/80 sm:text-xl">
                      {t(m.description)}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-mist/65 sm:text-lg">
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

        {(isMap ? inViewList : results).length === 0 && (
          <p className="py-16 text-center text-sm text-mist/75">
            {t("No needs posted in {{place}} yet.", { place: placeQuery || t("your area") })}
          </p>
        )}

        <div className="flex justify-center py-8">
          <Link
            to="/post-need"
            className="inline-flex items-center justify-center rounded-full bg-tone-indigo/15 px-6 py-3 text-base font-semibold text-sand ring-1 ring-tone-indigo/45 transition hover:bg-tone-indigo/25"
          >
            {t("Post a Need")}
          </Link>
        </div>

        {active && <MinistryPost ministry={active} onClose={() => setActiveId(null)} />}
      </main>
    </div>
  );
}
