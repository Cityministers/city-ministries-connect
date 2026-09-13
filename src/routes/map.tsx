import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, List, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AccountMenu } from "@/components/AccountMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteNav } from "@/components/SiteNav";
import { MinistryPost } from "@/components/MinistryPost";
import { toneStyles } from "@/data/ministries";
import { LiveMap, type MapBounds } from "@/components/LiveMap";
import { useSession } from "@/hooks/useSession";
import { listUserMinistries } from "@/lib/ministries.functions";
import { toMinistry } from "@/lib/user-ministries";
import { useHomePoint, useMapPosts, usePlaceCenter } from "@/lib/use-map-view";

export const Route = createFileRoute("/map")({
  validateSearch: (search: Record<string, unknown>): { place?: string; new?: string } => {
    const raw = search["place"];
    const place = (
      typeof raw === "string" || typeof raw === "number" ? String(raw) : ""
    ).replace(/^"|"$/g, "");
    const fresh = typeof search["new"] === "string" ? search["new"] : "";
    return {
      ...(place.length > 0 ? { place } : {}),
      ...(fresh.length > 0 ? { new: fresh } : {}),
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
  const { place, new: freshId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [location, setLocation] = useState(place ?? "Portland, OR 97006");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(
    freshId ? `user-${freshId}` : null,
  );
  const session = useSession();

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 20000);
    return () => clearTimeout(t);
  }, [highlightId]);

  const fetchUserMinistries = useServerFn(listUserMinistries);
  const { data: userPosts } = useQuery({
    queryKey: ["user-ministries"],
    queryFn: () => fetchUserMinistries(),
  });

  const all = useMemo(() => (userPosts ?? []).map(toMinistry), [userPosts]);
  const layout = useMemo(() => layoutMap(all), [all]);
  const district = useMemo(() => findDistrict(layout, location), [layout, location]);

  const active = all.find((m) => m.id === activeId);
  const nearby = all.filter((m) => matchesPlace(m, location));

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
                placeholder="City or ZIP code"
                aria-label="Search by city or ZIP code"
              />
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.15em] text-mist/40">
                zip or city
              </span>
            </form>
            <Link
              to="/ministries"
              search={{ place: location }}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-tone-cyan/15 text-tone-cyan ring-1 ring-tone-cyan/45 transition hover:bg-tone-cyan/25"
              aria-label="List view"
            >
              <List className="size-5" aria-hidden="true" />
            </Link>
          </div>

          {/* Row 3: needs actions */}
          <div className="flex w-full flex-row gap-2">
            <Link
              to="/post-need"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-tone-emerald/15 px-4 py-2.5 text-sm font-semibold text-tone-emerald ring-1 ring-tone-emerald/45 transition hover:bg-tone-emerald/25 active:translate-y-0.5 sm:flex-initial"
            >
              Post a Need
            </Link>
            <Link
              to="/needs"
              search={{ place: location }}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-tone-indigo/15 px-4 py-2.5 text-sm font-semibold text-tone-indigo ring-1 ring-tone-indigo/45 transition hover:bg-tone-indigo/25 active:translate-y-0.5 sm:flex-initial"
            >
              View Needs
            </Link>
          </div>
        </div>
      </header>

      {/* Map */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-2 pb-5 sm:px-6 sm:pt-3 sm:pb-8">
        <PanMap
          width={layout.width}
          height={layout.height}
          background={cityMap}
          {...(district ? { target: { x: district.cx, y: district.cy } } : {})}
          label="Ministry map. Drag to move around and see other ZIP codes."
          className="map-fade h-[70dvh] min-h-[360px] w-full"
        >
          {layout.pins.map(({ ministry: m, x, y }, i) => {
            const isOwned = m.ownerId === session?.user?.id;
            return (
              <button
                key={m.id}
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => {
                  setActiveId(m.id);
                  if (m.id === highlightId) setHighlightId(null);
                }}
                className={`pin-drop absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer p-2 ${
                  m.id === highlightId ? "pin-pulse" : ""
                } ${isOwned ? "pin-owned" : ""}`}
                style={{ left: x, top: y, animationDelay: `${Math.min(i, 12) * 60}ms` }}
                aria-label={`Open ${isOwned ? "your " : ""}${m.label} post`}
              >
                {m.avatarUrl ? (
                  <div className="relative mx-auto size-16 overflow-hidden rounded-xl ring-1 ring-mist/30 shadow-[0_8px_20px_-6px_rgba(0,0,0,.8)] transition-transform hover:-translate-y-1 sm:size-20">
                    <img
                      src={m.avatarUrl}
                      alt={`${m.label} — ${m.poster.name}`}
                      className="size-full object-cover"
                      draggable={false}
                    />
                  </div>
                ) : (
                  <div
                    className={`relative mx-auto grid size-16 place-items-center rounded-xl ring-1 shadow-[0_8px_20px_-6px_rgba(0,0,0,.8)] transition-transform hover:-translate-y-1 sm:size-20 ${toneStyles[m.tone]}`}
                  >
                    <m.icon className="size-7 sm:size-8" aria-hidden="true" />
                  </div>
                )}
                {isOwned && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-lemon px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink shadow-md ring-1 ring-lemon/50">
                    Yours
                  </span>
                )}
                <span className="mx-auto mt-2 line-clamp-2 block w-[190px] rounded-xl bg-ink/90 px-2 py-1 text-center text-base font-semibold leading-tight text-sand ring-1 ring-mist/20">
                  {m.label}
                </span>
              </button>
            );
          })}
        </PanMap>
        {layout.pins.length === 0 && (
          <p className="mt-3 text-center text-sm text-mist/80">No ministries posted yet.</p>
        )}
        {highlightId && layout.pins.some((p) => p.ministry.id === highlightId) && (
          <p className="mt-3 text-center text-sm font-semibold text-lemon">
            Your ministry is live here
          </p>
        )}
        <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-mist/40">
          {nearby.length} ministries near {location}
        </p>

        {active && <MinistryPost ministry={active} onClose={() => setActiveId(null)} />}
      </main>

      {/* CTA */}
      <footer className="border-t border-ink-soft">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-6 text-center sm:px-6 sm:py-8">
          <Link
            to="/start"
            className="inline-flex w-full items-center justify-center rounded-full bg-lemon px-8 py-3.5 text-lg font-bold text-ink ring-1 ring-lemon/60 transition-transform hover:-translate-y-0.5 sm:w-auto sm:text-xl"
          >
            Start Your Ministry
          </Link>
          {!session && (
            <p className="text-xs text-mist/70">
              New here?{" "}
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="text-sand/90 underline decoration-mist/30 underline-offset-2 hover:decoration-mist/60"
              >
                Create Account
              </Link>
              <span className="mx-1.5 text-mist/40">·</span>
              <Link
                to="/auth"
                className="text-sand/90 underline decoration-mist/30 underline-offset-2 hover:decoration-mist/60"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
