import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  HandHelping,
  Heart,
  Loader2,
  MessageCircle,
  Send,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import {
  addComment,
  getMyPostState,
  listComments,
  toggleFavorite,
  toggleLike,
  type CommentDTO,
} from "@/lib/favorites.functions";
import { startConversation } from "@/lib/messages.functions";
import { deletePrayer, type PrayerDTO } from "@/lib/prayers.functions";

/**
 * A prayer opens in the same card shape as a ministry or a need: the poster's
 * block at the top, their own words below. No quote on this card.
 */
export function PrayerPost({
  prayer,
  canRemove = false,
  onClose,
  onRemoved,
}: {
  prayer: PrayerDTO;
  canRemove?: boolean;
  onClose: () => void;
  onRemoved?: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const remove = useServerFn(deletePrayer);
  const fetchState = useServerFn(getMyPostState);
  const like = useServerFn(toggleLike);
  const save = useServerFn(toggleFavorite);
  const fetchComments = useServerFn(listComments);
  const postComment = useServerFn(addComment);
  const startChat = useServerFn(startConversation);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [comments, setComments] = useState<CommentDTO[] | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [photoOpen, setPhotoOpen] = useState(false);

  const postRef = { postType: "prayer" as const, postId: prayer.id };

  useEffect(() => {
    let active = true;
    setLiked(false);
    setFavorited(false);
    setLikeCount(0);
    setComments(null);
    setCommentOpen(false);
    setMessageOpen(false);
    setNeedsAuth(false);
    setError(null);
    void (async () => {
      const list = await fetchComments({ data: postRef });
      if (active) setComments(list);
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setSignedIn(Boolean(data.user));
      setMyId(data.user?.id ?? null);
      if (!data.user) return;
      try {
        const state = await fetchState({ data: postRef });
        if (!active) return;
        setLiked(state.liked);
        setFavorited(state.favorited);
        setLikeCount(state.likeCount);
      } catch {
        /* prayer unavailable */
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prayer.id]);

  function guard(): boolean {
    if (signedIn) return true;
    setNeedsAuth(true);
    return false;
  }

  async function handleLike() {
    if (!guard()) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await like({ data: postRef });
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  }

  async function handleFavorite() {
    if (!guard()) return;
    const next = !favorited;
    setFavorited(next);
    try {
      await save({ data: postRef });
    } catch {
      setFavorited(!next);
    }
  }

  async function handleComment() {
    if (commentText.trim().length === 0) return;
    if (!guard()) return;
    setBusy(true);
    setError(null);
    try {
      await postComment({ data: { ...postRef, body: commentText.trim() } });
      setCommentText("");
      setComments(await fetchComments({ data: postRef }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Could not post that comment."));
    } finally {
      setBusy(false);
    }
  }

  async function handleSend() {
    if (messageText.trim().length === 0) return;
    if (!guard()) return;
    setBusy(true);
    setError(null);
    try {
      const { conversationId } = await startChat({
        data: { ...postRef, body: messageText.trim() },
      });
      onClose();
      void navigate({ to: "/messages/$conversationId", params: { conversationId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Could not send that message."));
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);
    try {
      await remove({ data: { id: prayer.id } });
      onRemoved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Could not remove that prayer."));
      setBusy(false);
    }
  }

  const place = [prayer.city, prayer.zip].filter(Boolean).join(" ");
  const posterName = prayer.anonymous ? t("Anonymous") : prayer.posterName;
  const canMessage = !prayer.anonymous && prayer.ownerId != null && prayer.ownerId !== myId;
  const commentCount = comments ? comments.length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/80 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={prayer.shortTitle}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-y-auto rounded-b-2xl bg-ink-soft shadow-[0_20px_50px_-20px_rgba(0,0,0,.9)] ring-1 ring-mist/20 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative grid h-40 w-full place-items-center overflow-hidden bg-prayer/15 text-prayer sm:h-44">
          {prayer.imageUrl ? (
            <img
              src={prayer.imageUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <HandHelping className="size-16 opacity-80" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-ink/80 text-sand ring-1 ring-mist/20 transition hover:bg-ink"
            aria-label={t("Close post")}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPhotoOpen(true)}
              className="shrink-0 rounded-full transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lemon"
              aria-label={t("Open {{name}}'s profile photo", { name: posterName })}
            >
              {prayer.posterPhotoUrl && !prayer.anonymous ? (
                <img
                  src={prayer.posterPhotoUrl}
                  alt=""
                  className="size-12 rounded-full object-cover ring-2 ring-mist/25"
                  loading="lazy"
                />
              ) : (
                <span className="grid size-12 place-items-center rounded-full bg-prayer/20 font-display text-lg text-prayer ring-1 ring-prayer/40">
                  {prayer.anonymous ? "?" : posterName.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-mist/50">
                {t("Prayer")}
                {place ? ` · ${place}` : ""}
              </p>
              <h2 className="truncate font-display text-3xl font-semibold text-sand sm:text-4xl">
                {posterName}
              </h2>
            </div>
          </div>

          <h3 className="font-heading text-2xl font-semibold text-sand">{prayer.shortTitle}</h3>
          <p className="whitespace-pre-line text-lg leading-relaxed text-sand">{prayer.body}</p>

          {prayer.churchId && (
            <Link
              to="/church/$id"
              params={{ id: prayer.churchId }}
              className="text-sm text-lemon underline decoration-lemon/40 underline-offset-2"
            >
              {t("See this church")}
            </Link>
          )}

          <div className="flex items-center gap-2 border-y border-mist/15 py-3">
            <button
              type="button"
              onClick={() => void handleLike()}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
                liked ? "bg-lemon/15 text-lemon ring-lemon/50" : "text-mist/70 ring-mist/20 hover:bg-ink"
              }`}
              aria-pressed={liked}
            >
              <ThumbsUp className="size-5" aria-hidden="true" />
              {likeCount}
            </button>
            <button
              type="button"
              onClick={() => void handleFavorite()}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
                favorited ? "bg-rose/15 text-rose ring-rose/50" : "text-mist/70 ring-mist/20 hover:bg-ink"
              }`}
              aria-pressed={favorited}
              aria-label={favorited ? t("Remove from favorites") : t("Save to favorites")}
            >
              <Heart className="size-5" aria-hidden="true" />
              {favorited ? t("Saved") : t("Save")}
            </button>
            <button
              type="button"
              onClick={() => setCommentOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-mist/70 ring-1 ring-mist/20 transition hover:bg-ink"
              aria-expanded={commentOpen}
            >
              <MessageCircle className="size-5" aria-hidden="true" />
              {commentCount}
            </button>
          </div>

          {needsAuth && (
            <p className="rounded-lg bg-lemon/10 px-3 py-2 text-sm text-lemon ring-1 ring-lemon/30">
              <Link to="/auth" className="font-semibold underline underline-offset-2">
                {t("Sign in")}
              </Link>{" "}
              {t("to save, like, comment, or message.")}
            </p>
          )}

          {commentOpen && (
            <div className="flex flex-col gap-2">
              {(comments ?? []).map((c) => (
                <div key={c.id} className="rounded-xl bg-ink px-3 py-2 ring-1 ring-mist/15">
                  <p className="text-sm font-medium text-sand">{c.authorName}</p>
                  <p className="text-base text-mist/80">{c.body}</p>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("Leave a kind word")}
                  maxLength={500}
                  className="flex-1 rounded-full bg-ink px-4 py-2.5 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                />
                <button
                  type="button"
                  onClick={() => void handleComment()}
                  disabled={busy}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-lemon text-ink disabled:opacity-60"
                  aria-label={t("Post comment")}
                >
                  {busy ? (
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="size-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          )}

          {messageOpen && canMessage && (
            <div className="flex flex-col gap-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder={t("Write a note to {{name}}", { name: posterName })}
                className="rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-5 py-3 text-base font-semibold text-ink disabled:opacity-60"
              >
                {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
                {t("Send message")}
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-rose/15 px-3 py-2 text-sm text-rose ring-1 ring-rose/30">
              {error}
            </p>
          )}

          {canMessage && !messageOpen && (
            <button
              type="button"
              onClick={() => {
                if (!guard()) return;
                setMessageOpen(true);
                setMessageText((prev) => prev || t("I'm praying for you."));
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-prayer px-5 py-3 text-base font-semibold text-parchment ring-1 ring-prayer/60 transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
              {t("Message {{name}}", { name: posterName })}
            </button>
          )}

          {canRemove && (
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={busy}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-rose ring-1 ring-rose/30 transition hover:bg-ink/70 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              {t("Remove this prayer")}
            </button>
          )}
        </div>
      </div>

      {photoOpen && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-ink/95 p-6"
          onClick={(e) => {
            e.stopPropagation();
            setPhotoOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={t("Open {{name}}'s profile photo", { name: posterName })}
        >
          {prayer.posterPhotoUrl && !prayer.anonymous ? (
            <img
              src={prayer.posterPhotoUrl}
              alt=""
              className="max-h-[70dvh] w-auto rounded-2xl object-contain ring-1 ring-mist/20"
            />
          ) : (
            <span className="grid size-40 place-items-center rounded-full bg-prayer/20 font-display text-6xl text-prayer ring-1 ring-prayer/40">
              {prayer.anonymous ? "?" : posterName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
