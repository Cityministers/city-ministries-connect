import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, EyeOff, Heart, ImagePlus, Loader2, MessageCircle, MoreVertical, PartyPopper, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { AccountMenu } from "@/components/AccountMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { ChurchMenu } from "@/components/ChurchMenu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { ROOMS, roomIcon } from "@/lib/rooms";
import { timeAgo } from "@/lib/time-ago";
import { amIAdmin, getPrivateRoomMediaUrls, getRoomMediaUrls, moderateRoomPost } from "@/lib/room-posts.functions";

const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

export const Route = createFileRoute("/rooms/$slug")({
  head: ({ params }) => {
    const title = ROOMS.find((r) => r.slug === params.slug)?.title ?? "Room";
    const desc = `Join the ${title} room on City Ministers.`;
    return {
      meta: [
        { title: `${title} — City Ministers` },
        { name: "description", content: desc },
        { property: "og:title", content: `${title} — City Ministers` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: RoomPage,
});

type Post = {
  id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  status: string;
  media_path: string | null;
  media_type: string | null;
  title?: string | null;
  source_url?: string | null;
  source_name?: string | null;
  image_url?: string | null;
};

function RoomPage() {
  const { slug } = Route.useParams();
  const { t } = useTranslation();
  const session = useSession();
  const qc = useQueryClient();
  const userId = session?.user?.id;
  const Icon = roomIcon(slug);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [congrats, setCongrats] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPublicUrls = useServerFn(getRoomMediaUrls);
  const fetchPrivateUrls = useServerFn(getPrivateRoomMediaUrls);
  const checkAdmin = useServerFn(amIAdmin);
  const moderate = useServerFn(moderateRoomPost);

  const adminQ = useQuery({
    queryKey: ["am-admin", userId],
    enabled: !!userId,
    retry: false,
    queryFn: () => checkAdmin().catch(() => ({ admin: false })),
  });
  const isAdmin = !!adminQ.data?.admin;

  const { data, isLoading } = useQuery({
    queryKey: ["room", slug, userId ?? "anon"],
    queryFn: async () => {
      const { data: room } = await supabase.from("rooms").select("*").eq("slug", slug).maybeSingle();
      if (!room) return null;
      const { data: posts } = await supabase
        .from("room_posts")
        .select("id, author_id, parent_id, body, created_at, status, media_path, media_type, title, source_url, source_name, image_url")
        .eq("room_id", room.id)
        .order("created_at", { ascending: false })
        .limit(200);
      const list = (posts ?? []) as Post[];
      const ids = list.map((p) => p.id);
      const authorIds = [...new Set(list.map((p) => p.author_id))];
      const approvedPaths = list.filter((p) => p.media_path && p.status === "approved").map((p) => p.media_path!);
      const privatePaths = list.filter((p) => p.media_path && p.status !== "approved").map((p) => p.media_path!);
      const [{ data: likes }, { data: profiles }, pub, priv] = await Promise.all([
        ids.length
          ? supabase.from("room_post_likes").select("post_id, user_id").in("post_id", ids)
          : Promise.resolve({ data: [] as { post_id: string; user_id: string }[] }),
        authorIds.length
          ? supabase.from("profiles").select("id, display_name").in("id", authorIds)
          : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
        approvedPaths.length ? fetchPublicUrls({ data: { paths: approvedPaths } }).catch(() => ({})) : Promise.resolve({}),
        privatePaths.length && userId
          ? fetchPrivateUrls({ data: { paths: privatePaths } }).catch(() => ({}))
          : Promise.resolve({}),
      ]);
      const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? ""]));
      const urls: Record<string, string> = { ...(pub as Record<string, string>), ...(priv as Record<string, string>) };
      return { room, posts: list, likes: likes ?? [], names, urls };
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["room", slug] });

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    const isVideo = f.type.startsWith("video/");
    const isImage = f.type.startsWith("image/");
    if (!isVideo && !isImage) { toast.error(t("Please choose a photo or video.")); return; }
    if (isImage && f.size > MAX_IMAGE) { toast.error(t("Photos must be under 10 MB.")); return; }
    if (isVideo && f.size > MAX_VIDEO) { toast.error(t("Videos must be under 50 MB.")); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (body: string, parentId: string | null) => {
    if (!userId || !data?.room || !body.trim()) return;
    setPosting(true);
    try {
      let media_path: string | null = null;
      let media_type: string | null = null;
      if (!parentId && file) {
        const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("room-media").upload(path, file, { contentType: file.type });
        if (upErr) { toast.error(t("Upload failed. Please try again.")); return; }
        media_path = path;
        media_type = file.type.startsWith("video/") ? "video" : "image";
      }
      const { error } = await supabase.from("room_posts").insert({
        room_id: data.room.id,
        author_id: userId,
        parent_id: parentId,
        body: body.trim().slice(0, 2000),
        media_path,
        media_type,
      });
      if (error) { toast.error(t("Something went wrong. Please try again.")); return; }
      if (parentId) {
        setReplyText("");
        setReplyTo(null);
      } else {
        setDraft("");
        clearFile();
        if (!isAdmin) setCongrats(true);
      }
      refresh();
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId: string, liked: boolean) => {
    if (!userId) { toast(t("Sign in to like posts.")); return; }
    if (liked) await supabase.from("room_post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    else await supabase.from("room_post_likes").insert({ post_id: postId, user_id: userId });
    refresh();
  };

  const remove = async (postId: string) => {
    if (!window.confirm(t("Delete this post?"))) return;
    await supabase.from("room_posts").delete().eq("id", postId);
    refresh();
  };

  const act = async (id: string, action: "approve" | "hide" | "decline" | "delete") => {
    if ((action === "delete" || action === "decline") && !window.confirm(t("Remove this post?"))) return;
    try {
      await moderate({ data: { id, action } });
      toast.success(
        action === "approve" ? t("Post approved") : action === "hide" ? t("Post hidden") : t("Post removed"),
      );
      refresh();
      qc.invalidateQueries({ queryKey: ["admin", "room-posts"] });
    } catch {
      toast.error(t("Something went wrong. Please try again."));
    }
  };

  const topLevel = (data?.posts.filter((p) => !p.parent_id) ?? [])
    .slice()
    .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
  const repliesOf = (id: string) =>
    (data?.posts.filter((p) => p.parent_id === id) ?? []).slice().reverse();

  const PostItem = ({ p, isReply }: { p: Post; isReply?: boolean }) => {
    const likes = data!.likes.filter((l) => l.post_id === p.id);
    const liked = likes.some((l) => l.user_id === userId);
    const name = data!.names.get(p.author_id) || t("Member");
    return (
      <div className={isReply ? "mt-3 border-l-2 border-mist/25 pl-3" : ""}>
        <div className="flex items-center gap-2 text-sm">
          <span className="grid size-7 place-items-center rounded-full bg-ink font-bold text-lemon">
            {name[0]?.toUpperCase()}
          </span>
          <span className="font-semibold">{name}</span>
          <span className="text-mist">{timeAgo(p.created_at)}</span>
        </div>
        {p.status !== "approved" && (
          <span className="mt-2 inline-block rounded-full bg-lemon/15 px-2.5 py-0.5 text-xs font-bold text-lemon">
            {p.status === "pending" ? t("Waiting for approval") : t("Hidden")}
          </span>
        )}
        {p.image_url && (
          <img
            src={p.image_url}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            className="mt-3 aspect-[1.9/1] w-full rounded-xl bg-ink object-cover"
          />
        )}
        {p.title && <h3 className="mt-3 font-display text-xl font-bold leading-snug">{p.title}</h3>}
        <p className="mt-2 whitespace-pre-wrap text-base">{p.body}</p>
        {p.source_url && (
          <a
            href={p.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-lemon underline underline-offset-2"
          >
            {t("Read the full story at")} {p.source_name ?? new URL(p.source_url).hostname}
          </a>
        )}
        {p.media_path && data!.urls[p.media_path] && (
          p.media_type === "video" ? (
            <video src={data!.urls[p.media_path]} controls playsInline preload="metadata" className="mt-3 max-h-96 w-full rounded-xl bg-ink object-contain" />
          ) : (
            <img src={data!.urls[p.media_path]} alt="" loading="lazy" className="mt-3 max-h-96 w-full rounded-xl bg-ink object-contain" />
          )
        )}
        {isAdmin && p.status === "pending" && (
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => act(p.id, "approve")} className="inline-flex items-center gap-1 rounded-full bg-tone-cyan/25 px-4 py-1.5 text-sm font-bold ring-1 ring-tone-cyan/55">
              <Check className="size-4" aria-hidden="true" />{t("Approve")}
            </button>
            <button type="button" onClick={() => act(p.id, "decline")} className="inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-bold ring-1 ring-mist/40">
              <X className="size-4" aria-hidden="true" />{t("Decline")}
            </button>
          </div>
        )}
        <div className="mt-2 flex items-center gap-4 text-sm text-mist">
          <button type="button" onClick={() => toggleLike(p.id, liked)} className={`inline-flex items-center gap-1 ${liked ? "text-rose" : ""}`}>
            <Heart className={`size-4 ${liked ? "fill-current" : ""}`} aria-hidden="true" />
            {likes.length}
          </button>
          {!isReply && userId && p.status === "approved" && (
            <button type="button" onClick={() => setReplyTo(replyTo === p.id ? null : p.id)} className="inline-flex items-center gap-1">
              <MessageCircle className="size-4" aria-hidden="true" />
              {t("Reply")}
            </button>
          )}
          {p.author_id === userId && !isAdmin && (
            <button type="button" onClick={() => remove(p.id)} className="inline-flex items-center gap-1" aria-label={t("Delete")}>
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          )}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-auto grid size-8 place-items-center rounded-full ring-1 ring-mist/30" aria-label={t("Admin options")}>
                <MoreVertical className="size-4" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {p.status !== "approved" && (
                  <DropdownMenuItem onClick={() => act(p.id, "approve")}><Check className="mr-2 size-4" />{t("Approve")}</DropdownMenuItem>
                )}
                {p.status !== "hidden" && (
                  <DropdownMenuItem onClick={() => act(p.id, "hide")}><EyeOff className="mr-2 size-4" />{t("Hide")}</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => act(p.id, "delete")}><Trash2 className="mr-2 size-4" />{t("Delete")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-4 sm:px-6">
          <Link to="/explore" className="grid size-9 place-items-center rounded-full ring-1 ring-mist/20" aria-label={t("Back")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="flex justify-center"><BrandLogo /></div>
          <div className="flex items-center gap-2"><ChurchMenu /><AccountMenu /></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        {isLoading ? (
          <p className="text-mist">{t("Loading…")}</p>
        ) : !data ? (
          <p className="text-mist">{t("This room wasn't found.")}</p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-xl bg-ink-soft ring-1 ring-mist/30">
                <Icon className="size-6 text-lemon" aria-hidden="true" />
              </span>
              <h1 className="font-display text-3xl font-semibold">{t(data.room.title)}</h1>
            </div>
            <p className="mt-3 text-base text-mist">{t(data.room.description)}</p>

            <div className="mt-6 rounded-2xl border border-mist/35 bg-ink-soft p-4">
              {userId ? (
                <>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder={t("Start a topic…")}
                    className="w-full resize-none rounded-lg bg-ink p-3 text-base outline-none placeholder:text-mist"
                  />
                  {preview && file && (
                    <div className="relative mt-2 overflow-hidden rounded-xl ring-1 ring-mist/30">
                      {file.type.startsWith("video/") ? (
                        <video src={preview} controls playsInline className="max-h-72 w-full bg-ink object-contain" />
                      ) : (
                        <img src={preview} alt="" className="max-h-72 w-full bg-ink object-contain" />
                      )}
                      <button type="button" onClick={clearFile} aria-label={t("Remove")} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-ink/80 ring-1 ring-mist/40">
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-sand ring-1 ring-mist/40">
                      <ImagePlus className="size-4" aria-hidden="true" />
                      {file ? t("Change photo or video") : t("Add a photo or video")}
                    </button>
                    <button type="button" onClick={() => submit(draft, null)} disabled={!draft.trim() || posting} className="inline-flex items-center gap-2 rounded-full bg-tone-cyan/25 px-5 py-2 font-bold text-sand ring-1 ring-tone-cyan/55 disabled:opacity-50">
                      {posting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                      {t("Post")}
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/auth" className="font-semibold text-lemon">{t("Sign in to post in this room")}</Link>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {topLevel.length === 0 && <p className="text-mist">{t("No posts yet. Be the first!")}</p>}
              {topLevel.map((p) => (
                <article key={p.id} className={`rounded-2xl border bg-ink-soft p-4 ${p.status === "approved" ? "border-mist/35" : "border-lemon/50"}`}>
                  <PostItem p={p} />
                  {repliesOf(p.id).map((r) => <PostItem key={r.id} p={r} isReply />)}
                  {replyTo === p.id && (
                    <div className="mt-3 flex gap-2">
                      <input value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={2000} placeholder={t("Write a reply…")} className="flex-1 rounded-lg bg-ink px-3 py-2 outline-none placeholder:text-mist" />
                      <button type="button" onClick={() => submit(replyText, p.id)} className="rounded-full bg-tone-cyan/25 px-4 font-bold ring-1 ring-tone-cyan/55">{t("Send")}</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      <Dialog open={congrats} onOpenChange={setCongrats}>
        <DialogContent className="border-ink-soft bg-ink-soft text-sand sm:rounded-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-lemon/15 text-lemon">
              <PartyPopper className="size-7" aria-hidden="true" />
            </div>
            <DialogTitle className="font-display text-2xl font-semibold sm:text-3xl">{t("Congratulations!")}</DialogTitle>
          </DialogHeader>
          <p className="text-center text-base text-mist/80 sm:text-lg">
            {t("Your post was sent for approval. You'll get a notification when it's live.")}
          </p>
          <button type="button" onClick={() => setCongrats(false)} className="mt-2 rounded-full bg-lemon px-6 py-3.5 text-lg font-semibold text-ink">
            {t("OK")}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
