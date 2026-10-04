import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, HandHelping, List, Search, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccountMenu } from "@/components/AccountMenu";
import { ChurchMenu } from "@/components/ChurchMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteNav } from "@/components/SiteNav";
import { MinistryPost } from "@/components/MinistryPost";
import { PrayerPost } from "@/components/PrayerPost";
import { NeighborhoodVideoFeed, NeighborhoodVideoForm, NeighborhoodVideoViewer } from "@/components/NeighborhoodVideos";
import { Button } from "@/components/ui/button";
import { toneStyles } from "@/data/ministries";
import { LiveMap, type MapBounds } from "@/components/LiveMap";
import { useSession } from "@/hooks/useSession";
import { CHURCH_PIN_COLOR, churchIcon } from "@/lib/church-icons";
import { formatMiles, milesBetween } from "@/lib/distance";

import { listChurches } from "@/lib/churches.functions";
import { iconMarkup } from "@/lib/map-icon";
import { PRAYER_PIN_COLOR, VIDEO_PIN_COLOR } from "@/lib/map-tones";
import { listUserMinistries } from "@/lib/ministries.functions";
import { listPublicPrayers } from "@/lib/prayers.functions";
import { listNeighborhoodVideos, listMyNeighborhoodVideos } from "@/lib/neighborhood-videos.functions";
import { toMinistry } from "@/lib/user-ministries";
import { useHomePoint, useMapPosts, usePlaceCenter } from "@/lib/use-map-view";

export const Route = createFileRoute("/map")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { place?: string; new?: string; mode?: "prayer" | "video" } => {
    const raw = search["place"];
    const place = (
      typeof raw === "string" || typeof raw === "number" ? String(raw) : ""
    ).replace(/^"|"$/g, "");
    const fresh = typeof search["new"] === "string" ? search["new"] : "";
    return {
      ...(place.length > 0 ? { place } : {}),
      ...(fresh.length > 0 ? { new: fresh } : {}),
      ...((search["mode"] === "prayer" || search["mode"] === "video") ? { mode: search["mode"] as "prayer" | "video" } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Ministry map — City Ministers" },
      {
        name: "description",
        content:
          "City Ministers maps the ministries happening on your street — a coffee chat, a ride across town, free clothes. Post your gift and let neighbors find you.",
      },
      { property: "og:title", content: "Ministry map — City Ministers" },
      {
        property: "og:description",
        content:
          "Find and post local ministries — coffee chats, ride shares, free clothes — right on your city's map.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { t } = useTranslation();
  const { place, new: freshId, mode: freshMode } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [location, setLocation] = useState(place ?? "Portland, OR 97209");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePrayerId, setActivePrayerId] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(
    freshId
      ? freshId.startsWith("church-")
        ? freshId
        : freshMode === "prayer"
          ? `prayer-${freshId}`
          : `user-${freshId}`
      : null,
  );
  const session = useSession();

  // The glow stays until the visitor taps another post — no timer.


  const fetchUserMinistries = useServerFn(listUserMinistries);
  const { data: userPosts } = useQuery({
    queryKey: ["user-ministries"],
    queryFn: () => fetchUserMinistries(),
  });

  const all = useMemo(() => (userPosts ?? []).map(toMinistry), [userPosts]);
  const center = usePlaceCenter(location);
  const { origin, hasHome } = useHomePoint(Boolean(session), center);

  const [mode, setMode] = useState<"view" | "church" | "prayer" | "video">(
    freshMode === "prayer" || freshMode === "video" ? freshMode : "view",
  );
  // Follow links like /map?mode=video even when the map is already open.
  useEffect(() => {
    if (freshMode === "prayer" || freshMode === "video") setMode(freshMode);
  }, [freshMode]);
  const [videoTab, setVideoTab] = useState<"all" | "near" | "downtown" | "zip">("all");
  const [videoZip, setVideoZip] = useState("");
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [pending, setPending] = useState<MapBounds | null>(null);
  const moved = mode === "view" && pending !== null && pending !== bounds;

  const { points, list } = useMapPosts(
    all,
    origin,
    mode === "view" ? bounds : null,
    "view",
    session?.user?.id ?? null,
    highlightId,
  );
  const active = all.find((m) => m.id === activeId);


  // Churches share the map with posts; tapping one opens that church's page.
  const fetchChurches = useServerFn(listChurches);
  const { data: churches } = useQuery({
    queryKey: ["churches"],
    queryFn: () => fetchChurches(),
  });
  const churchPoints = useMemo(
    () =>
      (churches ?? [])
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => ({
          id: `church-${c.id}`,
          lat: c.lat as number,
          lng: c.lng as number,
          title: c.name,
          color: CHURCH_PIN_COLOR,
          glyph: iconMarkup(churchIcon(c.iconId)),
          kind: "place" as const,
          highlight: highlightId === `church-${c.id}`,
        })),
    [churches, highlightId],
  );

  // Prayers posted to the whole map — their own pin colour and their own filter.
  const fetchPrayers = useServerFn(listPublicPrayers);
  const { data: prayers, refetch: refetchPrayers } = useQuery({
    queryKey: ["public-prayers"],
    queryFn: () => fetchPrayers(),
  });
  const prayerPoints = useMemo(
    () =>
      (prayers ?? [])
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({
          id: `prayer-${p.id}`,
          lat: p.lat as number,
          lng: p.lng as number,
          title: p.shortTitle,
          color: PRAYER_PIN_COLOR,
          glyph: iconMarkup(HandHelping),
          highlight: highlightId === `prayer-${p.id}`,
        })),
    [prayers, highlightId],
  );
  const activePrayer = (prayers ?? []).find((p) => p.id === activePrayerId);

  const fetchVideos = useServerFn(listNeighborhoodVideos);
  const fetchMyVideos = useServerFn(listMyNeighborhoodVideos);
  const { data: videos, refetch: refetchVideos } = useQuery({ queryKey: ["neighborhood-videos"], queryFn: () => fetchVideos() });
  const { data: myVideos, refetch: refetchMyVideos } = useQuery({ queryKey: ["my-neighborhood-videos", session?.user?.id], queryFn: () => fetchMyVideos(), enabled: !!session?.user?.id, retry: false });
  const pendingVideos = (myVideos ?? []).filter((v) => v.status !== "approved");
  const DOWNTOWN = { minLat: 45.505, maxLat: 45.54, minLng: -122.695, maxLng: -122.65 };
  const videoMatchesTab = (v: { lat: number; lng: number; zip: string }) => {
    if (videoTab === "all") return true;
    if (videoTab === "downtown")
      return v.lat >= DOWNTOWN.minLat && v.lat <= DOWNTOWN.maxLat && v.lng >= DOWNTOWN.minLng && v.lng <= DOWNTOWN.maxLng;
    if (videoTab === "zip") return videoZip.trim().length > 0 && v.zip.startsWith(videoZip.trim());
    // "near" — within ~15 miles of the visitor's home point
    return milesBetween(origin, { lat: v.lat, lng: v.lng }) <= 15;
  };
  const visibleVideos = [...pendingVideos, ...(videos ?? [])].filter(videoMatchesTab);
  const videoPoints = useMemo(() => (videos ?? []).filter(videoMatchesTab).map((v) => ({
    id: `video-${v.id}`, lat: v.lat, lng: v.lng, title: v.title,
    color: VIDEO_PIN_COLOR, glyph: iconMarkup(Video), highlight: highlightId === `video-${v.id}`,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [videos, highlightId, videoTab, videoZip, origin]);
  const activeVideo = visibleVideos.find((v) => v.id === activeVideoId) ?? null;

  const allPoints = useMemo(
    () =>
      mode === "church"
        ? churchPoints
        : mode === "video"
          ? videoPoints
        : mode === "prayer"
          ? prayerPoints
          : [...points, ...churchPoints],
    [points, churchPoints, prayerPoints, videoPoints, mode],
  );

  /** Churches with a distance from home, nearest first. */
  const churchList = useMemo(
    () =>
      (churches ?? [])
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => {
          const miles = milesBetween(origin, { lat: c.lat as number, lng: c.lng as number });
          return { church: c, miles, distance: formatMiles(miles) };
        })
        .sort((a, b) => a.miles - b.miles),
    [churches, origin],
  );


  // A freshly created post or church sits in the middle of the screen while it glows.
  const spotlight = highlightId ? allPoints.find((p) => p.id === highlightId) : undefined;
  const mapCenter = spotlight ? { lat: spotlight.lat, lng: spotlight.lng } : center;

  function selectPoint(id: string) {
    if (id.startsWith("church-")) {
      void navigate({ to: "/church/$id", params: { id: id.slice("church-".length) } });
      return;
    }
    if (id.startsWith("prayer-")) {
      setActivePrayerId(id.slice("prayer-".length));
      if (id !== highlightId) setHighlightId(null);
      return;
    }
    if (id.startsWith("video-")) {
      setActiveVideoId(id.slice("video-".length));
      if (id !== highlightId) setHighlightId(null);
      return;
    }
    setActiveId(id);
    if (id !== highlightId) setHighlightId(null);
  }


  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      {/* Banner / search */}
      <header className="border-b border-ink-soft bg-ink">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pt-4 pb-3 sm:px-6">
          {/* Row 1: back + menu | logo | account */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Link
                to="/"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
                aria-label={t("Back to home")}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Link>
              <SiteNav />
            </div>
            <div className="flex items-center justify-center">
              <BrandLogo />
            </div>
            <div className="flex items-center justify-end gap-2">
              <ChurchMenu />
<AccountMenu />
            </div>
          </div>

          {/* Row 2: search + list */}
          <div className="flex w-full items-center gap-2">
            <form
              className="flex flex-1 items-center gap-2 rounded-full bg-ink px-4 py-2.5 ring-1 ring-mist/20 transition focus-within:ring-lemon/50"
              onSubmit={(e) => e.preventDefault()}
              role="search"
            >
              <Search className="size-4 shrink-0 text-lemon" aria-hidden="true" />
              <input
                className="w-full min-w-0 bg-transparent text-sm text-sand placeholder:text-mist/50 focus:outline-none"
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  void navigate({ search: { place: e.target.value }, replace: true });
                }}
                placeholder={t("City or ZIP code")}
                aria-label={t("Search by city or ZIP code")}
              />
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.15em] text-mist/40">
                {t("zip or city")}
              </span>
            </form>
            <Link
              to="/ministries"
              search={{ place: location }}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-tone-cyan/15 text-tone-cyan ring-1 ring-tone-cyan/45 transition hover:bg-tone-cyan/25"
              aria-label={t("List view")}
            >
              <List className="size-5" aria-hidden="true" />
            </Link>
          </div>

          {/* Row 3: create + map type */}
          <div className="grid w-full grid-cols-3 gap-2" aria-label={t("Map post controls")}>
            <Button
              asChild
              className="h-10 rounded-full bg-tone-emerald/15 px-2 text-sm font-semibold text-sand shadow-none ring-1 ring-tone-emerald/45 hover:bg-tone-emerald/25 sm:px-5"
            >
              <Link to="/start" aria-label={t("Create a ministry post")}>
                {t("Create Post")}
              </Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-full bg-tone-cyan/25 px-2 text-sm font-semibold text-sand shadow-none ring-1 ring-tone-cyan/55 hover:bg-tone-cyan/35 sm:px-5"
            >
              <Link
                to="/map"
                search={{ place: location }}
                aria-current="page"
                onClick={() => {
                  setMode("view");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                {t("Ministries")}
              </Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-full bg-tone-indigo/15 px-2 text-sm font-semibold text-sand shadow-none ring-1 ring-tone-indigo/45 hover:bg-tone-indigo/25 sm:px-5"
            >
              <Link to="/needs" search={{ place: location }}>
                {t("Needs")}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Map */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-2 pb-5 sm:px-6 sm:pt-3 sm:pb-8">
        <div className="relative">
          <LiveMap
            points={allPoints}
            center={mapCenter}
            zoom={spotlight ? 16 : 12}
            onSelect={selectPoint}
            onBoundsChange={(b) => {
              setPending(b);
              setBounds((prev) => prev ?? b);
            }}
            label={t("Ministry map. Drag to explore other neighborhoods.")}
            className="map-fade h-[60dvh] min-h-[320px] w-full"
          />
          {moved && (
            <button
              type="button"
              onClick={() => setBounds(pending)}
              className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-ink-soft px-4 py-2 text-sm font-semibold text-sand shadow-lg ring-1 ring-mist/25 transition hover:bg-ink-soft/80 hover:ring-mist/40"
            >
              {t("Search this area")}
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="grid w-full grid-cols-3 gap-2" aria-label={t("Map layers")}>
            <Button
              type="button"
              onClick={() => setMode(mode === "church" ? "view" : "church")}
              className={`h-10 rounded-full px-2 text-sm font-semibold text-sand shadow-none ring-1 transition sm:px-5 ${
                mode === "church"
                  ? "bg-lemon/30 ring-lemon/70"
                  : "bg-lemon/15 ring-lemon/45 hover:bg-lemon/25"
              }`}
            >
              {t("Churches")}
            </Button>
            <Button
              type="button"
              onClick={() => setMode(mode === "prayer" ? "view" : "prayer")}
              className={`h-10 rounded-full px-2 text-sm font-semibold text-sand shadow-none ring-1 transition sm:px-5 ${
                mode === "prayer"
                  ? "bg-prayer/30 ring-prayer/70"
                  : "bg-prayer/15 ring-prayer/45 hover:bg-prayer/25"
              }`}
            >
              {t("Prayers")}
            </Button>
            <Button
              type="button"
              onClick={() => setMode(mode === "video" ? "view" : "video")}
              aria-label={t("Videos")}
              title={t("Videos")}
              className={`grid h-10 place-items-center rounded-full px-2 text-sm font-semibold text-sand shadow-none transition sm:px-5 ${
                mode === "video"
                  ? "video-glow bg-video-deep ring-1 ring-video/60"
                  : "bg-video-deep/50 ring-1 ring-video/40 hover:bg-video-deep/75"
              }`}
            >
              <span className={`grid size-6 place-items-center rounded-md ring-1 ${mode === "video" ? "ring-video-light/70" : "ring-video-light/45"}`}>
                <Video className="size-4" aria-hidden="true" strokeWidth={2.25} />
              </span>
            </Button>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-mist/40">
            {mode === "church"
              ? t("{{count}} churches", { count: churchList.length })
              : mode === "prayer"
                ? t("{{count}} prayers", { count: prayerPoints.length })
                : mode === "video"
                  ? `${videos?.length ?? 0} videos`
                : t("{{count}} nearby", { count: list.length + churchList.length })}
          </p>
        </div>


        {!hasHome && (
          <p className="mt-2 text-xs text-mist/70">
            {t("Add your ZIP code on your profile to see how far each ministry is from you.")}
          </p>
        )}

        {mode === "video" && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap rounded-full bg-ink-soft p-1 ring-1 ring-mist/15">
              {(["all", "near", "downtown", "zip"] as const).map((vt) => (
                <button
                  key={vt}
                  type="button"
                  onClick={() => setVideoTab(vt)}
                  className={`h-8 rounded-full px-3 py-1 text-xs font-semibold transition ${
                    videoTab === vt
                      ? "bg-ink text-sand ring-1 ring-mist/20"
                      : "text-mist ring-1 ring-transparent hover:bg-mist/10 hover:text-sand"
                  }`}
                >
                  {vt === "all" ? t("All") : vt === "near" ? t("Near me") : vt === "downtown" ? t("Downtown") : t("By ZIP")}
                </button>
              ))}
            </div>
            {videoTab === "zip" && (
              <input
                value={videoZip}
                onChange={(e) => setVideoZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                placeholder={t("Enter a ZIP code")}
                inputMode="numeric"
                className="w-full rounded-xl bg-ink-soft px-3 py-2 text-sm text-sand ring-1 ring-mist/15 placeholder:text-mist/50 focus:outline-none focus:ring-mist/40"
              />
            )}
          </div>
        )}
        {mode === "video" && <NeighborhoodVideoForm userId={session?.user?.id ?? null} defaultPlace={location} onPosted={() => void refetchMyVideos()} />}
        {mode === "video" && <NeighborhoodVideoFeed videos={videos ?? []} pending={pendingVideos} onSelect={(id) => {
          setActiveVideoId(id);
          if (`video-${id}` !== highlightId) setHighlightId(null);
        }} onRemoved={() => { void refetchMyVideos(); void refetchVideos(); }} />}
        <ul className="mt-3 space-y-2">
          {mode === "prayer" &&
            (prayers ?? []).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActivePrayerId(p.id);
                    if (`prayer-${p.id}` !== highlightId) setHighlightId(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-ink-soft p-3 text-left ring-1 ring-prayer/25 transition hover:ring-prayer/50"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-prayer/15 text-prayer ring-1 ring-prayer/40">
                    <HandHelping className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-heading text-lg text-sand sm:text-base">
                      {p.shortTitle}
                    </span>
                    <span className="block truncate text-xs text-mist/70">
                      {p.posterName}
                      {p.city ? ` · ${p.city}` : ""}
                      {p.zip ? ` ${p.zip}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          {mode !== "church" && mode !== "prayer" && mode !== "video" &&
            list.map(({ post: m, distance }) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveId(m.id);
                  if (m.id !== highlightId) setHighlightId(null);
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-ink-soft p-3 text-left ring-1 ring-mist/10 transition hover:ring-mist/30"
              >
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt=""
                    className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-mist/20"
                  />
                ) : (
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-xl ring-1 ${toneStyles[m.tone]}`}
                  >
                    <m.icon className="size-5" aria-hidden="true" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-heading text-lg text-sand sm:text-base">{t(m.label)}</span>
                  <span className="block truncate text-xs text-mist/70">
                    {m.city}
                    {m.zip ? ` ${m.zip}` : ""}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-lemon ring-1 ring-lemon/30">
                  {distance}
                </span>
              </button>
            </li>
          ))}
          {(mode === "church" || mode === "view") &&
            churchList.map(({ church: c, distance }) => {
              const Icon = churchIcon(c.iconId);
              return (
                <li key={c.id}>
                  <Link
                    to="/church/$id"
                    params={{ id: c.id }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-ink-soft p-3 text-left ring-1 ring-lemon/20 transition hover:ring-lemon/40"
                  >
                    {c.photoUrl ? (
                      <img
                        src={c.photoUrl}
                        alt=""
                        className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-mist/20"
                      />
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-lemon/15 text-lemon ring-1 ring-lemon/40">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-heading text-lg text-sand sm:text-base">
                        {c.name}
                      </span>
                      <span className="block truncate text-xs text-mist/70">
                        {t("Church")} · {c.city}
                        {c.zip ? ` ${c.zip}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-lemon ring-1 ring-lemon/30">
                      {distance}
                    </span>
                  </Link>
                </li>
              );
            })}
          {(mode === "video" ? false : mode === "church"
            ? churchList.length === 0
            : mode === "prayer"
              ? (prayers ?? []).length === 0
              : list.length === 0 && churchList.length === 0) && (
            <li className="rounded-2xl bg-ink-soft p-4 text-center text-sm text-mist/70">
              {mode === "church"
                ? t("No churches on the map yet.")
                : mode === "prayer"
                  ? t("No prayers on the map yet — be the first to post one.")
                  : t("No ministries in this area yet — drag the map to look around.")}
            </li>
          )}
        </ul>

        {mode === "prayer" && (
          <Link
            to="/post-prayer"
            className="mt-4 inline-flex items-center justify-center gap-2 self-start rounded-full bg-prayer-deep px-6 py-3 text-base font-semibold text-parchment ring-1 ring-prayer/40 transition hover:opacity-90"
          >
            <HandHelping className="size-5" aria-hidden="true" />
            {t("Post a Prayer")}
          </Link>
        )}


        {active && <MinistryPost ministry={active} onClose={() => setActiveId(null)} />}
        {activePrayer && (
          <PrayerPost
            prayer={activePrayer}
            canRemove={Boolean(
              activePrayer.ownerId && activePrayer.ownerId === session?.user?.id,
            )}
            onClose={() => setActivePrayerId(null)}
            onRemoved={() => void refetchPrayers()}
          />
        )}
        <NeighborhoodVideoViewer video={activeVideo} onClose={() => setActiveVideoId(null)} />
      </main>

      {/* CTA */}
      <footer className="border-t border-ink-soft">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-6 text-center sm:px-6 sm:py-8">
          <Link
            to="/start"
            className="inline-flex w-full items-center justify-center rounded-full bg-tone-cyan/25 px-8 py-3.5 text-lg font-bold text-sand ring-1 ring-tone-cyan/55 transition hover:bg-tone-cyan/35 sm:w-auto sm:text-xl"
          >
            {t("Start Your Ministry")}
          </Link>
          {!session && (
            <p className="text-xs text-mist/70">
              {t("New here?")}{" "}
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="text-sand/90 underline decoration-mist/30 underline-offset-2 hover:decoration-mist/60"
              >
                {t("Create Account")}
              </Link>
              <span className="mx-1.5 text-mist/40">·</span>
              <Link
                to="/auth"
                className="text-sand/90 underline decoration-mist/30 underline-offset-2 hover:decoration-mist/60"
              >
                {t("Sign in")}
              </Link>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
