import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Church, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AccountMenu } from "@/components/AccountMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { ChurchMenu } from "@/components/ChurchMenu";
import { supabase } from "@/integrations/supabase/client";
import { listChurchesIAttend, listMyChurches, type ChurchDTO } from "@/lib/churches.functions";
import { roomIconById } from "@/lib/rooms";
import { isInFeed, type RoomRow } from "@/lib/room-feed";
import { Plus } from "lucide-react";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore churches & rooms — City Ministers" },
      { name: "description", content: "Search churches and community rooms on City Ministers." },
      { property: "og:title", content: "Explore churches & rooms — City Ministers" },
      { property: "og:description", content: "Search churches and community rooms on City Ministers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const session = useSession();

  const fetchAttended = useServerFn(listChurchesIAttend);
  const fetchOwned = useServerFn(listMyChurches);
  const { data: homeChurches = [] } = useQuery({
    queryKey: ["explore-home-churches"],
    enabled: Boolean(session),
    retry: false,
    queryFn: async (): Promise<ChurchDTO[]> => {
      try {
        const [attended, owned] = await Promise.all([fetchAttended(), fetchOwned()]);
        const byId = new Map<string, ChurchDTO>();
        for (const c of [...attended, ...owned]) byId.set(c.id, c);
        return [...byId.values()];
      } catch {
        return [];
      }
    },
  });


  const { data: churches = [] } = useQuery({
    queryKey: ["explore-churches"],
    queryFn: async () => {
      const { data } = await supabase
        .from("churches")
        .select("id, name, city, zip")
        .eq("status", "active")
        .order("name")
        .limit(200);
      return data ?? [];
    },
  });

  const userId = (session as { user?: { id: string } } | null)?.user?.id;
  const { data: allRooms = [] } = useQuery({
    queryKey: ["explore-rooms", userId ?? "anon"],
    queryFn: async (): Promise<RoomRow[]> => {
      const { data } = await supabase.from("rooms").select("id, slug, title, icon, status, created_by, category, in_default_feed").order("pinned", { ascending: false }).order("sort");
      return (data ?? []) as RoomRow[];
    },
  });
  const { data: memberships = {} } = useQuery({
    queryKey: ["room-memberships", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase.from("room_memberships").select("room_id, hidden");
      return Object.fromEntries((data ?? []).map((d) => [d.room_id, d.hidden])) as Record<string, boolean>;
    },
  });
  const rooms = allRooms
    .filter((r) => r.status === "approved" && (userId ? isInFeed(r, memberships) : r.in_default_feed || r.category === "general"))
    .filter((r) => !term || t(r.title).toLowerCase().includes(term));
  const matches = churches.filter(
    (c) => !term || `${c.name} ${c.city} ${c.zip}`.toLowerCase().includes(term),
  );

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-4 sm:px-6">
          <Link to="/" className="grid size-9 place-items-center rounded-full ring-1 ring-mist/20" aria-label={t("Back to home")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="flex justify-center"><BrandLogo /></div>
          <div className="flex items-center gap-2"><ChurchMenu /><AccountMenu /></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        {session && homeChurches.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-mist">{t("Your home")}</h2>
            <div className="mt-2 grid gap-2">
              {homeChurches.map((c) => (
                <Link
                  key={c.id}
                  to="/church/$id"
                  params={{ id: c.id }}
                  className="flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-mist/35 bg-ink-soft px-4 py-3 active:scale-[0.98]"
                >
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-ink">
                      <Church className="size-5 text-lemon" aria-hidden="true" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-sand">{c.name}</span>
                    <span className="block truncate text-sm text-mist">{[c.city, c.zip].filter(Boolean).join(" ")}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
        <h1 className="font-display text-xl font-semibold leading-tight">{t("Explore churches & rooms")}</h1>
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-mist/35 bg-ink-soft px-3 py-2">
          <Search className="size-4 text-mist" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("Search by name, city or ZIP")}
            className="w-full bg-transparent text-base outline-none placeholder:text-mist"
          />
        </label>

        <div className="mt-6 flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-mist">{t("Rooms")}</h2>
          {session && (
            <Link to="/rooms/manage" aria-label={t("Manage rooms")} className="grid size-7 place-items-center rounded-full bg-lemon/15 text-lemon ring-1 ring-lemon/60 active:scale-95">
              <Plus className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        <div className="mt-2 grid gap-2">
          {rooms.map((r) => {
            const Icon = roomIconById(r.icon);
            return (
              <Link key={r.slug} to="/rooms/$slug" params={{ slug: r.slug }} className="flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-mist/35 bg-ink-soft px-4 py-3 font-semibold active:scale-[0.98]">
                <Icon className="size-5 shrink-0 text-lemon" aria-hidden="true" />
                <span className="min-w-0 truncate">{t(r.title)}</span>
              </Link>
            );
          })}
        </div>

        <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-mist">{t("Churches")}</h2>
        <div className="mt-2 grid gap-2">
          {matches.map((c) => (
            <Link key={c.id} to="/church/$id" params={{ id: c.id }} className="flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-mist/35 bg-ink-soft px-4 py-3 active:scale-[0.98]">
              <Church className="size-5 shrink-0 text-lemon" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{c.name}</span>
                <span className="block truncate text-sm text-mist">{[c.city, c.zip].filter(Boolean).join(" ")}</span>
              </span>
            </Link>
          ))}
          {matches.length === 0 && <p className="text-mist">{t("No churches found.")}</p>}
        </div>
      </main>
    </div>
  );
}
