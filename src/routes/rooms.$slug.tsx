import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Heart, MessageCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { AccountMenu } from "@/components/AccountMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { ChurchMenu } from "@/components/ChurchMenu";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { ROOMS, roomIcon } from "@/lib/rooms";

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

  const { data, isLoading } = useQuery({
    queryKey: ["room", slug],
    queryFn: async () => {
      const { data: room } = await supabase.from("rooms").select("*").eq("slug", slug).maybeSingle();
      if (!room) return null;
      const { data: posts } = await supabase
        .from("room_posts")
        .select("id, author_id, parent_id, body, created_at")
        .eq("room_id", room.id)
        .order("created_at", { ascending: false })
        .limit(200);
      const list = (posts ?? []) as Post[];
      const ids = list.map((p) => p.id);
      const authorIds = [...new Set(list.map((p) => p.author_id))];
      const [{ data: likes }, { data: profiles }] = await Promise.all([
        ids.length
          ? supabase.from("room_post_likes").select("post_id, user_id").in("post_id", ids)
          : Promise.resolve({ data: [] as { post_id: string; user_id: string }[] }),
        authorIds.length
          ? supabase.from("profiles").select("id, display_name").in("id", authorIds)
          : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
      ]);
      const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? ""]));
      return { room, posts: list, likes: likes ?? [], names };
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["room", slug] });

  const submit = async (body: string, parentId: string | null) => {
    if (!userId || !data?.room || !body.trim()) return;
    const { error } = await supabase.from("room_posts").insert({
      room_id: data.room.id,
      author_id: userId,
      parent_id: parentId,
      body: body.trim().slice(0, 2000),
    });
    if (error) { toast.error(t("Something went wrong. Please try again.")); return; }
    if (parentId) {
      setReplyText("");
      setReplyTo(null);
    } else setDraft("");
    refresh();
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

  const topLevel = data?.posts.filter((p) => !p.parent_id) ?? [];
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
          <span className="text-mist">{new Date(p.created_at).toLocaleDateString()}</span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-base">{p.body}</p>
        <div className="mt-2 flex items-center gap-4 text-sm text-mist">
          <button type="button" onClick={() => toggleLike(p.id, liked)} className={`inline-flex items-center gap-1 ${liked ? "text-rose" : ""}`}>
            <Heart className={`size-4 ${liked ? "fill-current" : ""}`} aria-hidden="true" />
            {likes.length}
          </button>
          {!isReply && userId && (
            <button type="button" onClick={() => setReplyTo(replyTo === p.id ? null : p.id)} className="inline-flex items-center gap-1">
              <MessageCircle className="size-4" aria-hidden="true" />
              {t("Reply")}
            </button>
          )}
          {p.author_id === userId && (
            <button type="button" onClick={() => remove(p.id)} className="inline-flex items-center gap-1" aria-label={t("Delete")}>
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
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
                  <div className="mt-2 flex justify-end">
                    <button type="button" onClick={() => submit(draft, null)} disabled={!draft.trim()} className="rounded-full bg-tone-cyan/25 px-5 py-2 font-bold text-sand ring-1 ring-tone-cyan/55 disabled:opacity-50">
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
                <article key={p.id} className="rounded-2xl border border-mist/35 bg-ink-soft p-4">
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
    </div>
  );
}
