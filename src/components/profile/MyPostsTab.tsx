import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, HandHeart, HeartHandshake, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { countryOptions } from "@/lib/country";
import { MotivationFields } from "@/components/MotivationFields";
import { NeedMetDialog } from "@/components/profile/NeedMetDialog";
import { reopenNeed } from "@/lib/need-completion.functions";
import {
  deleteMyPost,
  listMyPosts,
  repostMyPost,
  updateMyPost,
  type MyPostDTO,
} from "@/lib/my-posts.functions";

export function MyPostsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fetchPosts = useServerFn(listMyPosts);
  const save = useServerFn(updateMyPost);
  const repost = useServerFn(repostMyPost);
  const remove = useServerFn(deleteMyPost);
  const reopen = useServerFn(reopenNeed);

  const { data: posts, refetch, isLoading } = useQuery({
    queryKey: ["my-posts"],
    queryFn: () => fetchPosts(),
  });

  const [editing, setEditing] = useState<MyPostDTO | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [completing, setCompleting] = useState<MyPostDTO | null>(null);
  const [motRef, setMotRef] = useState("");
  const [motText, setMotText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await save({
        data: {
          postType: editing.postType,
          id: editing.id,
          shortTitle: String(form.get("shortTitle") ?? ""),
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? ""),
          city: String(form.get("city") ?? ""),
          zip: String(form.get("zip") ?? ""),
          country: String(form.get("country") ?? "US"),
          ...(editing.postType === "ministry" ? { motivationRef: motRef.trim(), motivationText: motText.trim() } : {}),
        },
      });
      setEditing(null);
      setNote(t("Saved."));
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Could not save that."));
    } finally {
      setBusy(false);
    }
  }

  async function handleRepost(post: MyPostDTO) {
    setBusy(true);
    setNote(null);
    try {
      await repost({ data: { postType: post.postType, id: post.id } });
      setNote(t('"{{title}}" is back at the top.', { title: post.shortTitle }));
      await refetch();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(post: MyPostDTO) {
    setBusy(true);
    try {
      await remove({ data: { postType: post.postType, id: post.id } });
      setConfirmId(null);
      setNote(t("Post deleted."));
      await refetch();
    } finally {
      setBusy(false);
    }
  }

  async function handleReopen(post: MyPostDTO) {
    setBusy(true);
    setError(null);
    try {
      await reopen({ data: { needId: post.id } });
      setNote("This need is open again.");
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["user-needs"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reopen this need.");
    } finally { setBusy(false); }
  }

  if (isLoading) return <p className="py-10 text-center text-base text-mist/60">{t("Loading…")}</p>;

  if (!posts || posts.length === 0) {
    return (
      <p className="rounded-2xl bg-ink-soft/60 p-6 text-center text-base text-mist/70 ring-1 ring-mist/15">
        {t("You haven’t posted a ministry or a need yet.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {completing && <NeedMetDialog needId={completing.id} title={completing.shortTitle} onClose={() => setCompleting(null)} onCompleted={() => {
        setCompleting(null);
        setNote("Need met. Your selected thank-you messages were sent.");
        void refetch();
        void queryClient.invalidateQueries({ queryKey: ["user-needs"] });
      }} />}
      {note && (
        <p className="rounded-lg bg-lemon/10 px-3 py-2 text-base text-lemon ring-1 ring-lemon/30">
          {note}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-rose/15 px-3 py-2 text-base text-rose ring-1 ring-rose/30">
          {error}
        </p>
      )}

      {posts.map((post) => {
        const Icon = post.postType === "need" ? HandHeart : HeartHandshake;
        const isEditing = editing?.id === post.id;
        return (
          <div
            key={`${post.postType}-${post.id}`}
            className="flex flex-col gap-3 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/35"
          >
            <div className="flex items-start gap-3">
              {post.photoUrl ? (
                <img
                  src={post.photoUrl}
                  alt=""
                  className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-mist/25"
                />
              ) : (
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-xl ring-1 ${
                    post.postType === "need"
                      ? "bg-ink-soft text-sand ring-mist/25"
                      : "bg-tone-purple/12 text-tone-purple ring-tone-purple/35"
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-mist/50">
                  {post.postType === "need" ? t("Need") : t("Ministry")} ·{" "}
                  {new Date(post.updatedAt).toLocaleDateString()}
                </p>
                {post.postType === "need" && post.status === "met" && <p className="text-sm font-semibold text-lemon">Need met{post.metAt ? ` · ${new Date(post.metAt).toLocaleDateString()}` : ""}</p>}
                <p className="truncate text-xl font-semibold text-sand sm:text-2xl">{post.shortTitle}</p>
                <p className="truncate text-base text-mist/60">
                  {[post.city, post.zip].filter(Boolean).join(" ")}
                </p>
              </div>
            </div>

            {!isEditing && (
              <p className="line-clamp-3 text-base leading-relaxed text-mist/75">
                {post.description}
              </p>
            )}

            {isEditing ? (
              <form className="flex flex-col gap-3" onSubmit={(e) => void handleSave(e)}>
                <input
                  name="shortTitle"
                  defaultValue={post.shortTitle}
                  maxLength={24}
                  required
                  className="rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                  aria-label={t("Short title")}
                />
                <input
                  name="title"
                  defaultValue={post.title}
                  maxLength={100}
                  className="rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                  aria-label={t("Quote or passage about your mission")}
                />
                <textarea
                  name="description"
                  defaultValue={post.description}
                  rows={4}
                  maxLength={400}
                  required
                  className="rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                  aria-label={t("Description")}
                />
                {post.postType === "ministry" && <MotivationFields refValue={motRef} textValue={motText} onRef={setMotRef} onText={setMotText} />}
                <label className="flex flex-col gap-1 text-sm text-mist">{t("Country")}<select name="country" defaultValue={post.country} className="rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20">{countryOptions.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
                <div className="flex gap-2">
                  <input
                    name="city"
                    defaultValue={post.city}
                    maxLength={80}
                    className="flex-1 rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                    aria-label={t("City")}
                    placeholder={t("City")}
                  />
                  <input
                    name="zip"
                    defaultValue={post.zip}
                    maxLength={20}
                    className="w-28 rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                    aria-label={t("Postal code / ZIP")}
                    placeholder={t("ZIP")}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-lemon px-4 py-3 text-base font-semibold text-ink disabled:opacity-60"
                  >
                    {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
                    {t("Save changes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-full bg-ink px-4 py-3 text-base font-semibold text-sand ring-1 ring-mist/25"
                  >
                    {t("Cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap gap-2">
                {post.postType === "need" && (post.status === "met" ? (
                  <Button type="button" variant="outline" disabled={busy} onClick={() => void handleReopen(post)} className="h-11 border-lemon/40 bg-ink text-lemon">Reopen need</Button>
                ) : post.status === "active" ? (
                  <Button type="button" disabled={busy} onClick={() => setCompleting(post)} className="h-11 bg-tone-indigo/25 text-sand ring-1 ring-tone-indigo/55 hover:bg-tone-indigo/35"><Check /> Need met</Button>
                ) : null)}
                <button
                  type="button"
                  onClick={() => { setEditing(post); setMotRef(post.motivationRef ?? ""); setMotText(post.motivationText ?? ""); }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-base font-medium text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  {t("Edit")}
                </button>
                <button
                  type="button"
                  disabled={busy || (post.postType === "need" && post.status !== "active")}
                  onClick={() => void handleRepost(post)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-base font-medium text-lemon ring-1 ring-lemon/30 transition hover:bg-lemon/10 disabled:opacity-60"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  {t("Repost")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(confirmId === post.id ? null : post.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-base font-medium text-rose ring-1 ring-rose/30 transition hover:bg-rose/10"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  {t("Delete")}
                </button>
              </div>
            )}

            {confirmId === post.id && !isEditing && (
              <div className="flex items-center gap-2 rounded-xl bg-rose/10 p-3 ring-1 ring-rose/30">
                <p className="flex-1 text-base text-mist/80">{t("Delete this post for good?")}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDelete(post)}
                  className="rounded-full bg-rose px-4 py-2 text-base font-semibold text-white disabled:opacity-60"
                >
                  {t("Yes, delete")}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
