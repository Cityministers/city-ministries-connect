import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Minus, PartyPopper, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AccountMenu } from "@/components/AccountMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { roomIconById } from "@/lib/rooms";
import { isInFeed, type RoomRow } from "@/lib/room-feed";

export const Route = createFileRoute("/rooms/manage")({
  head: () => ({
    meta: [
      { title: "Manage your rooms — City Ministers" },
      { name: "description", content: "Add, remove or create community rooms for your City Ministers feed." },
      { property: "og:title", content: "Manage your rooms — City Ministers" },
      { property: "og:description", content: "Add, remove or create community rooms for your City Ministers feed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManageRoomsPage,
});

const ICONS = [
  { id: "globe", label: "Globe" },
  { id: "book", label: "Bible" },
  { id: "heart", label: "Heart" },
  { id: "newspaper", label: "News" },
  { id: "lightbulb", label: "Idea" },
];

function ManageRoomsPage() {
  const session = useSession();
  const userId = session?.user?.id;
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("globe");
  const [busy, setBusy] = useState(false);
  const [congrats, setCongrats] = useState(false);

  const { data: rooms = [], refetch: refetchRooms } = useQuery({
    queryKey: ["explore-rooms", userId ?? "anon"],
    queryFn: async (): Promise<RoomRow[]> => {
      const { data } = await supabase
        .from("rooms")
        .select("id, slug, title, icon, status, created_by, category, in_default_feed")
        .order("sort");
      return (data ?? []) as RoomRow[];
    },
  });
  const { data: memberships = {}, refetch: refetchMine } = useQuery({
    queryKey: ["room-memberships", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase.from("room_memberships").select("room_id, hidden");
      return Object.fromEntries((data ?? []).map((d) => [d.room_id, d.hidden])) as Record<string, boolean>;
    },
  });

  if (!userId) {
    return (
      <Shell>
        <p className="text-base text-sand">Sign in to choose the rooms in your list.</p>
        <Link to="/auth" className="mt-4 inline-block rounded-full bg-tone-cyan/25 px-5 py-2 font-bold ring-1 ring-tone-cyan/55">Sign in</Link>
      </Shell>
    );
  }

  const refresh = () => { refetchRooms(); refetchMine(); };
  const approved = rooms.filter((r) => r.status === "approved");
  const mine = approved.filter((r) => isInFeed(r, memberships));
  const notMine = approved.filter((r) => !isInFeed(r, memberships));
  const general = notMine.filter((r) => r.category === "general");
  const topics = notMine.filter((r) => r.category === "topic");
  const serve = notMine.filter((r) => r.category === "serve");
  const pending = rooms.filter((r) => r.status === "pending" && r.created_by === userId);

  async function setHidden(roomId: string, hidden: boolean) {
    // Update the list right away so the tap feels instant on phones.
    queryClient.setQueryData(["room-memberships", userId], (old: Record<string, boolean> | undefined) => ({ ...(old ?? {}), [roomId]: hidden }));
    const { error } = await supabase
      .from("room_memberships")
      .upsert({ user_id: userId!, room_id: roomId, hidden }, { onConflict: "user_id,room_id" });
    if (error) toast.error(error.message);
    refresh();
  }

  async function create() {
    const t = title.trim();
    if (t.length < 3) { toast.error("Give your room a title."); return; }
    setBusy(true);
    const slug = `${t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("rooms").insert({
      slug, title: t.slice(0, 80), description: desc.trim().slice(0, 300), icon, created_by: userId!, status: "pending", sort: 100,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setTitle(""); setDesc(""); setCongrats(true); refresh();
  }

  const Row = ({ r, add }: { r: RoomRow; add: boolean }) => {
    const Icon = roomIconById(r.icon);
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-mist/35 bg-ink-soft px-3 py-2.5">
        <Link to="/rooms/$slug" params={{ slug: r.slug }} className="flex min-w-0 items-center gap-2 text-base font-semibold text-sand">
          <Icon className="size-5 shrink-0 text-lemon" aria-hidden="true" />
          <span className="truncate">{r.title}</span>
        </Link>
        {add ? (
          <button type="button" onClick={() => setHidden(r.id, false)} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-tone-cyan/25 px-3 py-1 text-sm font-bold ring-1 ring-tone-cyan/55"><Plus className="size-4" />Add</button>
        ) : (
          <button type="button" onClick={() => setHidden(r.id, true)} className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ring-1 ring-mist/40"><Minus className="size-4" />Remove</button>
        )}
      </div>
    );
  };
  const H = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-mist">{children}</h2>
  );

  return (
    <Shell>
      <H>My rooms</H>
      <div className="mt-2 grid gap-2">
        {mine.length === 0 && <p className="text-mist">No rooms in your list yet.</p>}
        {mine.map((r) => <Row key={r.id} r={r} add={false} />)}
      </div>

      {(general.length > 0 || topics.length > 0) && <>
        <H>Suggested rooms</H>
        <div className="mt-2 grid gap-2">
          {[...general, ...topics].map((r) => <Row key={r.id} r={r} add />)}
        </div>
      </>}

      {serve.length > 0 && <>
        <H>Ways to serve</H>
        <div className="mt-2 grid gap-2">
          {serve.map((r) => <Row key={r.id} r={r} add />)}
        </div>
      </>}

      {pending.length > 0 && <>
        <H>Waiting for approval</H>
        <div className="mt-2 grid gap-2">
          {pending.map((r) => <p key={r.id} className="rounded-xl border border-mist/35 bg-ink-soft px-3 py-2.5 font-semibold">{r.title}</p>)}
        </div>
      </>}

      <H>Create a new room</H>
      <div className="mt-2 grid gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Room title" className="rounded-xl border border-mist/35 bg-ink-soft px-3 py-2 text-base outline-none placeholder:text-mist" />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} rows={2} placeholder="What is this room about?" className="rounded-xl border border-mist/35 bg-ink-soft px-3 py-2 text-base outline-none placeholder:text-mist" />
        <div className="flex flex-wrap gap-2">
          {ICONS.map((i) => (
            <button key={i.id} type="button" onClick={() => setIcon(i.id)} className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${icon === i.id ? "bg-lemon/20 ring-lemon" : "ring-mist/40"}`}>{i.label}</button>
          ))}
        </div>
        <button type="button" disabled={busy} onClick={create} className="rounded-full bg-tone-cyan/25 px-4 py-2 font-bold ring-1 ring-tone-cyan/55">{busy ? "Sending…" : "Send for approval"}</button>
      </div>

      <Dialog open={congrats} onOpenChange={setCongrats}>
        <DialogContent className="border-mist/35 bg-ink-soft text-center text-sand">
          <PartyPopper className="mx-auto size-10 text-lemon" />
          <DialogTitle className="font-display text-2xl">Congratulations!</DialogTitle>
          <p className="text-base">Your room was sent for approval. We'll notify you once it's live.</p>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-4 sm:px-6">
          <Link to="/explore" className="grid size-9 place-items-center rounded-full ring-1 ring-mist/20" aria-label="Back">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="flex justify-center"><BrandLogo /></div>
          <AccountMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <h1 className="font-display text-xl font-semibold">Manage your rooms</h1>
        {children}
      </main>
    </div>
  );
}
