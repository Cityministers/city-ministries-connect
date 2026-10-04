import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Pin, Save, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  cmsDeletePost,
  cmsDeleteRoom,
  cmsDeleteUser,
  cmsListPosts,
  cmsListRooms,
  cmsListUsers,
  cmsSaveSiteText,
  cmsSetRole,
  cmsSuspendUser,
  cmsUpdateChurch,
  cmsUpdatePost,
  cmsUpdateRoom,
  type CmsPost,
  type CmsPostType,
  type CmsRoom,
} from "@/lib/cms.functions";
import { SITE_TEXT_FIELDS, siteTextQuery } from "@/lib/site-text";
import type { AdminChurchDTO } from "@/lib/church-admin.functions";
import { timeAgo } from "@/lib/time-ago";

const card = "rounded-2xl border border-mist/30 bg-ink-soft p-4";
const btn = "inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-bold ring-1 transition disabled:opacity-50";
const input = "w-full rounded-xl bg-ink px-3 py-2.5 text-base text-sand ring-1 ring-mist/25 focus:outline-none focus:ring-lemon/50";

function useAct<T>(fn: (v: T) => Promise<unknown>, keys: string[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist/60" aria-hidden="true" />
      <input className={`${input} pl-9`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

// ---------------- Users ----------------
export function CmsUsersPanel() {
  const [q, setQ] = useState("");
  const list = useServerFn(cmsListUsers);
  const setRole = useServerFn(cmsSetRole);
  const suspend = useServerFn(cmsSuspendUser);
  const del = useServerFn(cmsDeleteUser);
  const users = useQuery({ queryKey: ["cms", "users", q], queryFn: () => list({ data: { q } }) });
  const keys = [["cms", "users"]];
  const roleM = useAct((v: { userId: string; role: "admin" | "moderator"; on: boolean }) => setRole({ data: v }), keys);
  const susM = useAct((v: { userId: string; suspended: boolean }) => suspend({ data: v }), keys);
  const delM = useAct((v: { userId: string }) => del({ data: v }), keys);
  const busy = roleM.isPending || susM.isPending || delM.isPending;

  return (
    <section className="space-y-3">
      <SearchBox value={q} onChange={setQ} placeholder="Search by name or email" />
      <p className="text-sm text-mist/70">{users.data?.length ?? 0} members</p>
      {users.isLoading && <p className="text-mist/70">Loading…</p>}
      {users.error && <p className="text-rose">{(users.error as Error).message}</p>}
      {users.data?.map((u) => {
        const isAdmin = u.roles.includes("admin");
        const isMod = u.roles.includes("moderator");
        return (
          <article key={u.id} className={card}>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-lg font-bold text-sand">{u.displayName || "No name yet"}</p>
              <p className="text-base text-mist/80">{u.email}</p>
            </div>
            <p className="mt-1 text-sm text-mist/70">
              Joined {timeAgo(u.createdAt)} ago
              {isAdmin && " · Admin"}
              {isMod && " · Moderator"}
              {u.isDemo && " · Sample account"}
              {u.suspended && <span className="text-rose"> · Suspended</span>}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => roleM.mutate({ userId: u.id, role: "moderator", on: !isMod })} className={`${btn} ring-tone-cyan/55 ${isMod ? "bg-tone-cyan/25" : ""}`}>
                {isMod ? "Remove moderator" : "Make moderator"}
              </button>
              <button type="button" disabled={busy} onClick={() => { if (isAdmin || window.confirm(`Give ${u.email} full admin access?`)) roleM.mutate({ userId: u.id, role: "admin", on: !isAdmin }); }} className={`${btn} ring-lemon/55 ${isAdmin ? "bg-lemon/20" : ""}`}>
                {isAdmin ? "Remove admin" : "Make admin"}
              </button>
              <button type="button" disabled={busy} onClick={() => susM.mutate({ userId: u.id, suspended: !u.suspended })} className={`${btn} ring-amber-400/50`}>
                {u.suspended ? "Unsuspend" : "Suspend"}
              </button>
              <button type="button" disabled={busy} onClick={() => { if (window.prompt(`Type DELETE to permanently remove ${u.email}`) === "DELETE") delM.mutate({ userId: u.id }); }} className={`${btn} ring-rose/50 text-rose`}>
                <Trash2 className="size-4" aria-hidden="true" />Delete
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

// ---------------- Posts ----------------
const POST_TYPES: { key: CmsPostType; label: string; statuses: string[] }[] = [
  { key: "ministry", label: "Ministries", statuses: ["active", "hidden", "removed"] },
  { key: "need", label: "Needs", statuses: ["active", "hidden", "removed", "met"] },
  { key: "prayer", label: "Prayers", statuses: ["approved", "pending", "hidden"] },
  { key: "video", label: "Videos", statuses: ["approved", "pending", "declined"] },
  { key: "room", label: "Room posts", statuses: ["approved", "pending", "declined"] },
];

export function CmsPostsPanel() {
  const [type, setType] = useState<CmsPostType>("ministry");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const list = useServerFn(cmsListPosts);
  const posts = useQuery({ queryKey: ["cms", "posts", type], queryFn: () => list({ data: { type } }) });
  const cfg = POST_TYPES.find((p) => p.key === type)!;
  const shown = (posts.data ?? []).filter(
    (p) => (status === "all" || p.status === status) && (!q || `${p.title} ${p.body} ${p.author}`.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {POST_TYPES.map((p) => (
          <button key={p.key} type="button" onClick={() => { setType(p.key); setStatus("all"); }} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${type === p.key ? "bg-sand text-ink" : "bg-ink-soft/50 text-mist ring-1 ring-mist/20"}`}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <SearchBox value={q} onChange={setQ} placeholder="Search title, text or author" />
        <select className={input} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
          <option value="all">All statuses</option>
          {cfg.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {posts.isLoading && <p className="text-mist/70">Loading…</p>}
      {posts.error && <p className="text-rose">{(posts.error as Error).message}</p>}
      {!posts.isLoading && shown.length === 0 && <p className="text-mist/70">Nothing here.</p>}
      {shown.map((p) => <PostRow key={p.id} post={p} statuses={cfg.statuses} />)}
    </section>
  );
}

function PostRow({ post, statuses }: { post: CmsPost; statuses: string[] }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const update = useServerFn(cmsUpdatePost);
  const del = useServerFn(cmsDeletePost);
  const keys = [["cms", "posts", post.type]];
  const upM = useAct((v: { title?: string; body?: string; status?: string }) => update({ data: { type: post.type, id: post.id, ...v } }), keys);
  const delM = useAct(() => del({ data: { type: post.type, id: post.id } }), keys);
  return (
    <article className={card}>
      {editing ? (
        <div className="space-y-2">
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} aria-label="Title" />
          <textarea className={`${input} min-h-28`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} aria-label="Text" />
          <div className="flex gap-2">
            <button type="button" disabled={upM.isPending} onClick={() => upM.mutate({ title, body }, { onSuccess: () => setEditing(false) })} className={`${btn} bg-lemon text-ink ring-lemon`}>
              <Save className="size-4" aria-hidden="true" />Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className={`${btn} ring-mist/40`}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-lg font-bold text-sand">{post.title || "(no title)"}</p>
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-base text-sand/85">{post.body}</p>
        </>
      )}
      <p className="mt-2 text-sm text-mist/70">{post.author} · {timeAgo(post.createdAt)} ago</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select className="rounded-full bg-ink px-3 py-1.5 text-sm text-sand ring-1 ring-mist/30" value={post.status} disabled={upM.isPending} onChange={(e) => upM.mutate({ status: e.target.value })} aria-label="Status">
          {[...new Set([post.status, ...statuses])].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className={`${btn} ring-mist/40`}>
            <Pencil className="size-4" aria-hidden="true" />Edit
          </button>
        )}
        <button type="button" disabled={delM.isPending} onClick={() => { if (window.confirm("Permanently delete this post?")) delM.mutate(undefined); }} className={`${btn} ring-rose/50 text-rose`}>
          <Trash2 className="size-4" aria-hidden="true" />Delete
        </button>
      </div>
    </article>
  );
}

// ---------------- Rooms ----------------
export function CmsRoomsPanel() {
  const list = useServerFn(cmsListRooms);
  const rooms = useQuery({ queryKey: ["cms", "rooms"], queryFn: () => list() });
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-mist">All rooms ({rooms.data?.length ?? 0})</h3>
      {rooms.isLoading && <p className="text-mist/70">Loading…</p>}
      {rooms.data?.map((r) => <RoomRow key={r.id} room={r} />)}
    </section>
  );
}

function RoomRow({ room }: { room: CmsRoom }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(room.title);
  const [description, setDescription] = useState(room.description);
  const update = useServerFn(cmsUpdateRoom);
  const del = useServerFn(cmsDeleteRoom);
  const keys = [["cms", "rooms"], ["admin", "pending-rooms"]];
  type Patch = { title?: string; description?: string; status?: "approved" | "pending" | "declined"; pinned?: boolean; inDefaultFeed?: boolean };
  const upM = useAct((v: Patch) => update({ data: { id: room.id, ...v } }), keys);
  const delM = useAct(() => del({ data: { id: room.id } }), keys);
  return (
    <article className={card}>
      {editing ? (
        <div className="space-y-2">
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Room name" />
          <textarea className={`${input} min-h-20`} value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Description" />
          <div className="flex gap-2">
            <button type="button" onClick={() => upM.mutate({ title, description }, { onSuccess: () => setEditing(false) })} className={`${btn} bg-lemon text-ink ring-lemon`}>Save</button>
            <button type="button" onClick={() => setEditing(false)} className={`${btn} ring-mist/40`}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <p className="flex items-center gap-2 text-lg font-bold text-sand">
            {room.pinned && <Pin className="size-4 text-lemon" aria-label="Pinned" />}
            {room.title}
          </p>
          <p className="mt-1 line-clamp-2 text-base text-sand/80">{room.description}</p>
        </>
      )}
      <p className="mt-2 text-sm text-mist/70">{room.category} · {room.status}{room.inDefaultFeed ? " · In everyone's feed" : ""}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {room.status !== "approved" && (
          <button type="button" onClick={() => upM.mutate({ status: "approved" })} className={`${btn} bg-tone-cyan/25 ring-tone-cyan/55`}>Approve</button>
        )}
        <button type="button" onClick={() => upM.mutate({ pinned: !room.pinned })} className={`${btn} ring-lemon/50`}>{room.pinned ? "Unpin" : "Pin to top"}</button>
        <button type="button" onClick={() => upM.mutate({ inDefaultFeed: !room.inDefaultFeed })} className={`${btn} ring-mist/40`}>{room.inDefaultFeed ? "Remove from default feed" : "Add to default feed"}</button>
        {!editing && <button type="button" onClick={() => setEditing(true)} className={`${btn} ring-mist/40`}><Pencil className="size-4" aria-hidden="true" />Edit</button>}
        <button type="button" onClick={() => { if (window.confirm(`Delete the room "${room.title}" and all its posts?`)) delM.mutate(undefined); }} className={`${btn} ring-rose/50 text-rose`}>
          <Trash2 className="size-4" aria-hidden="true" />Delete
        </button>
      </div>
    </article>
  );
}

// ---------------- Church edit ----------------
export function CmsChurchEdit({ church }: { church: AdminChurchDTO }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: church.name, address: church.address, city: church.city, zip: church.zip, description: "" });
  const update = useServerFn(cmsUpdateChurch);
  const m = useAct(() => update({ data: { id: church.id, ...f } }), [["admin", "churches"]]);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${btn} ring-mist/40`}>
        <Pencil className="size-4" aria-hidden="true" />Edit church details
      </button>
    );
  return (
    <div className="space-y-2 rounded-xl bg-ink p-3 ring-1 ring-mist/20">
      {(["name", "address", "city", "zip"] as const).map((k) => (
        <input key={k} className={input} value={f[k]} placeholder={k} aria-label={k} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      ))}
      <textarea className={`${input} min-h-20`} value={f.description} placeholder="Description (leave blank to clear)" onChange={(e) => setF({ ...f, description: e.target.value })} />
      <div className="flex gap-2">
        <button type="button" disabled={m.isPending} onClick={() => m.mutate(undefined, { onSuccess: () => setOpen(false) })} className={`${btn} bg-lemon text-ink ring-lemon`}>Save</button>
        <button type="button" onClick={() => setOpen(false)} className={`${btn} ring-mist/40`}>Cancel</button>
      </div>
    </div>
  );
}

// ---------------- Site text ----------------
export function CmsSiteTextPanel() {
  const current = useQuery(siteTextQuery);
  const save = useServerFn(cmsSaveSiteText);
  const m = useAct((v: { key: string; value: string }) => save({ data: v }), [["site-text"]]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const pages = [...new Set(SITE_TEXT_FIELDS.map((f) => f.page))];
  return (
    <section className="space-y-6">
      <p className="text-base text-mist/80">Edit page wording. Leave a box empty to go back to the original text.</p>
      {pages.map((page) => (
        <div key={page} className="space-y-3">
          <h3 className="font-display text-xl font-semibold text-lemon">{page}</h3>
          {SITE_TEXT_FIELDS.filter((f) => f.page === page).map((f) => {
            const value = draft[f.key] ?? current.data?.[f.key] ?? f.fallback;
            return (
              <div key={f.key} className={card}>
                <label className="block text-sm font-semibold text-mist" htmlFor={f.key}>{f.label}</label>
                <textarea id={f.key} className={`${input} mt-2 min-h-20`} value={value} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
                <button type="button" disabled={m.isPending} onClick={() => m.mutate({ key: f.key, value: value.trim() === f.fallback ? "" : value })} className={`${btn} mt-2 bg-lemon text-ink ring-lemon`}>
                  <Save className="size-4" aria-hidden="true" />Save
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}
