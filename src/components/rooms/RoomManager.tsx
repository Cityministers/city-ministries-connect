import { useState } from "react";
import { Minus, PartyPopper, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export type RoomRow = { id: string; slug: string; title: string; icon: string; status: string; created_by: string | null };

const ICONS = [
  { id: "globe", label: "Globe" },
  { id: "book", label: "Bible" },
  { id: "heart", label: "Heart" },
  { id: "newspaper", label: "News" },
  { id: "hourglass", label: "Hourglass" },
];

export function RoomManager({
  open, onOpenChange, rooms, hidden, userId, onChanged,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; rooms: RoomRow[]; hidden: Set<string>; userId: string; onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("globe");
  const [busy, setBusy] = useState(false);
  const [congrats, setCongrats] = useState(false);

  const approved = rooms.filter((r) => r.status === "approved");
  const mine = approved.filter((r) => !hidden.has(r.id));
  const others = approved.filter((r) => hidden.has(r.id));
  const pending = rooms.filter((r) => r.status === "pending" && r.created_by === userId);

  async function setHidden(roomId: string, h: boolean) {
    const { error } = await supabase.from("room_memberships").upsert({ user_id: userId, room_id: roomId, hidden: h });
    if (error) toast.error(error.message); else onChanged();
  }

  async function create() {
    const t = title.trim();
    if (t.length < 3) { toast.error("Give your room a title."); return; }
    setBusy(true);
    const slug = `${t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("rooms").insert({ slug, title: t.slice(0, 80), description: desc.trim().slice(0, 300), icon, created_by: userId, status: "pending", sort: 100 });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setTitle(""); setDesc(""); setCongrats(true); onChanged();
  }

  const row = "flex items-center justify-between gap-2 rounded-xl border border-mist/35 bg-ink px-3 py-2 text-base font-semibold";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto border-mist/35 bg-ink-soft text-sand">
          <DialogHeader><DialogTitle className="font-display text-xl">Manage your rooms</DialogTitle></DialogHeader>
          <h3 className="text-sm font-bold uppercase tracking-wide text-mist">My rooms</h3>
          <div className="grid gap-2">
            {mine.length === 0 && <p className="text-mist">No rooms in your list.</p>}
            {mine.map((r) => (
              <div key={r.id} className={row}><span className="truncate">{r.title}</span>
                <button type="button" onClick={() => setHidden(r.id, true)} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ring-1 ring-mist/40"><Minus className="size-4" />Remove</button>
              </div>
            ))}
          </div>
          {others.length > 0 && <>
            <h3 className="mt-2 text-sm font-bold uppercase tracking-wide text-mist">Add rooms</h3>
            <div className="grid gap-2">
              {others.map((r) => (
                <div key={r.id} className={row}><span className="truncate">{r.title}</span>
                  <button type="button" onClick={() => setHidden(r.id, false)} className="inline-flex items-center gap-1 rounded-full bg-tone-cyan/25 px-3 py-1 text-sm ring-1 ring-tone-cyan/55"><Plus className="size-4" />Add</button>
                </div>
              ))}
            </div>
          </>}
          {pending.length > 0 && <>
            <h3 className="mt-2 text-sm font-bold uppercase tracking-wide text-mist">Waiting for approval</h3>
            {pending.map((r) => <div key={r.id} className={row}><span className="truncate">{r.title}</span></div>)}
          </>}
          <h3 className="mt-2 text-sm font-bold uppercase tracking-wide text-mist">Create a new room</h3>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Room title" className="rounded-xl border border-mist/35 bg-ink px-3 py-2 text-base outline-none" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} rows={2} placeholder="What is this room about?" className="rounded-xl border border-mist/35 bg-ink px-3 py-2 text-base outline-none" />
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button key={i.id} type="button" onClick={() => setIcon(i.id)} className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${icon === i.id ? "bg-lemon/20 ring-lemon" : "ring-mist/40"}`}>{i.label}</button>
            ))}
          </div>
          <button type="button" disabled={busy} onClick={create} className="rounded-full bg-tone-cyan/25 px-4 py-2 font-bold ring-1 ring-tone-cyan/55">{busy ? "Sending…" : "Send for approval"}</button>
        </DialogContent>
      </Dialog>
      <Dialog open={congrats} onOpenChange={setCongrats}>
        <DialogContent className="border-mist/35 bg-ink-soft text-center text-sand">
          <PartyPopper className="mx-auto size-10 text-lemon" />
          <DialogTitle className="font-display text-2xl">Congratulations!</DialogTitle>
          <p className="text-base">Your room was sent for approval. We'll notify you once it's live.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
