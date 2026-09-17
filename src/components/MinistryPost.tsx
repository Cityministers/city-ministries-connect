import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarClock,
  
  Flag,
  Heart,
  Loader2,
  MessageCircle,
  MoreVertical,
  Send,
  ThumbsUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toneStyles, type Ministry } from "@/data/ministries";
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

export function MinistryPost({
  ministry,
  onClose,
}: {
  ministry: Ministry;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fetchState = useServerFn(getMyPostState);
  const like = useServerFn(toggleLike);
  const save = useServerFn(toggleFavorite);
  const fetchComments = useServerFn(listComments);
  const postComment = useServerFn(addComment);
  const startChat = useServerFn(startConversation);

  const [menuOpen, setMenuOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(false);
  const [imageLightboxOpen, setImageLightboxOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [comments, setComments] = useState<CommentDTO[] | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);

  const slides: { url: string; kind: "image" | "video" }[] =
    ministry.gallery && ministry.gallery.length > 0
      ? ministry.gallery
      : ministry.media
        ? [{ url: ministry.media, kind: "image" }]
        : ministry.avatarUrl
          ? [{ url: ministry.avatarUrl, kind: "image" }]
          : [];
  const current = slides[Math.min(slide, slides.length - 1)];


  const live = Boolean(ministry.postType && ministry.postId);
  const postRef =
    ministry.postType && ministry.postId
      ? { postType: ministry.postType, postId: ministry.postId }
      : null;

  useEffect(() => {
    setMenuOpen(false);
    setReported(false);
    setLiked(false);
    setFavorited(false);
    setViewingProfile(false);
    setImageLightboxOpen(false);
    setNeedsAuth(false);
    setComments(null);
    setCommentOpen(false);
    setCommentText("");
    setMessageOpen(false);
    setMessageText("");
    setError(null);
    setLikeCount(ministry.likes);
  }, [ministry.id, ministry.likes]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setSignedIn(Boolean(data.user));
      if (!postRef) return;
      const list = await fetchComments({ data: postRef });
      if (active) setComments(list);
      if (!data.user) return;
      try {
        const state = await fetchState({ data: postRef });
        if (!active) return;
        setLiked(state.liked);
        setFavorited(state.favorited);
        setLikeCount(state.likeCount);
      } catch {
        /* not signed in or post unavailable */
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ministry.id]);

  function guard(): boolean {
    if (signedIn) return true;
    setNeedsAuth(true);
    return false;
  }

  async function handleLike() {
    if (!postRef) {
      setLiked((v) => !v);
      return;
    }
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
    if (!postRef) {
      setFavorited((v) => !v);
      return;
    }
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
    if (!postRef || commentText.trim().length === 0) return;
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
    if (!postRef || messageText.trim().length === 0) return;
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

  const tone = toneStyles[ministry.tone];
  const Icon = ministry.icon;
  const commentCount = comments ? comments.length : ministry.comments;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/80 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={ministry.label}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-y-auto rounded-b-2xl bg-ink-soft shadow-[0_20px_50px_-20px_rgba(0,0,0,.9)] ring-1 ring-mist/20 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {current ? (
            current.kind === "video" ? (
              <video
                key={current.url}
                src={current.url}
                controls
                playsInline
                className="h-56 w-full bg-ink object-cover sm:h-64"
              />
            ) : (
              <img
                src={current.url}
                alt={ministry.mediaAlt ?? `${ministry.label} — ${ministry.poster.name}`}
                className="h-56 w-full object-cover sm:h-64"
                loading="lazy"
              />
            )
          ) : (
            <div className={`grid h-40 w-full place-items-center sm:h-44 ${tone}`}>
              <Icon className="size-16 opacity-80" aria-hidden="true" />
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-ink/80 text-sand ring-1 ring-mist/20 transition hover:bg-ink"
            aria-label={t("Close post")}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          {ministry.avatarUrl ? (
            <img
              src={ministry.avatarUrl}
              alt=""
              className="absolute bottom-3 left-3 size-11 rounded-xl object-cover ring-1 ring-mist/30"
            />
          ) : (
            <div
              className={`absolute bottom-3 left-3 grid size-11 place-items-center rounded-xl ring-1 ${tone}`}
            >
              <Icon className="size-5" aria-hidden="true" />
            </div>
          )}
        </div>

        {slides.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 pt-3 scrollbar-hide">
            {slides.map((item, i) => (
              <button
                key={item.url}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={t("Show {{kind}} {{n}} of {{total}}", { kind: item.kind === "video" ? t("video") : t("photo"), n: i + 1, total: slides.length })}
                aria-pressed={i === slide}
                className={`relative size-16 shrink-0 overflow-hidden rounded-xl ring-1 transition ${
                  i === slide ? "ring-2 ring-lemon" : "ring-mist/25 hover:ring-lemon/50"
                }`}
              >
                {item.kind === "video" ? (
                  <span className="grid size-full place-items-center bg-ink text-xs font-semibold text-sand">
                    {t("Video")}
                  </span>
                ) : (
                  <img src={item.url} alt="" className="size-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}


        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-mist/50 sm:text-base">
                {ministry.label} · {ministry.neighborhood}
              </p>
              <h2 className="font-display text-3xl font-semibold text-sand sm:text-4xl">
                {ministry.poster.name}
              </h2>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="grid size-9 place-items-center rounded-full text-mist/70 ring-1 ring-mist/20 transition hover:bg-ink"
                aria-label={t("More options")}
                aria-expanded={menuOpen}
              >
                <MoreVertical className="size-4" aria-hidden="true" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-xl bg-ink shadow-lg ring-1 ring-mist/20">
                  <button
                    type="button"
                    onClick={() => {
                      setReported(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-rose transition hover:bg-ink-soft"
                  >
                    <Flag className="size-4" aria-hidden="true" />
                    {t("Report Abuse")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {reported && (
            <p className="rounded-lg bg-rose/15 px-3 py-2 text-sm text-rose ring-1 ring-rose/30">
              {t("Thanks — our team will review this post.")}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setImageLightboxOpen(true)}
              className="shrink-0 rounded-full transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lemon"
              aria-label={t("Open {{name}}'s profile photo", { name: ministry.poster.name })}
            >
              {ministry.poster.photo ? (
                <img
                  src={ministry.poster.photo}
                  alt=""
                  className="size-12 rounded-full object-cover ring-2 ring-mist/25"
                  width={512}
                  height={512}
                  loading="lazy"
                />
              ) : (
                <span
                  className={`grid size-12 place-items-center rounded-full font-display text-lg ring-1 ${tone}`}
                  aria-hidden="true"
                >
                  {ministry.poster.name.charAt(0)}
                </span>
              )}
            </button>
            <div className="min-w-0 flex-1 border-l-2 border-lemon/40 bg-lemon/[0.06] py-2 pl-3">
              <p className="text-base leading-snug text-mist/90 sm:text-lg">
                <span className="pr-0.5 text-xl leading-none text-lemon/80" aria-hidden="true">&ldquo;</span>
                <span className="italic">{ministry.poster.bio}</span>
                <span className="pl-0.5 text-xl leading-none text-lemon/80" aria-hidden="true">&rdquo;</span>
              </p>
              <button
                type="button"
                onClick={() => setViewingProfile((v) => !v)}
                className="mt-1 text-sm font-medium text-lemon underline-offset-2 hover:underline"
                aria-expanded={viewingProfile}
              >
                {viewingProfile ? t("Close profile") : t("View profile")}
              </button>
            </div>
          </div>

          {viewingProfile && (
            <div className="flex flex-col gap-3 rounded-xl bg-ink/60 p-4 ring-1 ring-mist/15">
              <div className="flex items-center gap-3">
                {ministry.poster.photo ? (
                  <img
                    src={ministry.poster.photo}
                    alt={`Profile photo of ${ministry.poster.name}`}
                    className="size-14 shrink-0 rounded-full object-cover ring-2 ring-lemon/40"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className={`grid size-14 shrink-0 place-items-center rounded-full font-display text-xl ring-1 ${tone}`}
                    aria-hidden="true"
                  >
                    {ministry.poster.name.charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-display text-lg text-sand">{ministry.poster.name}</p>
                  <p className="text-sm text-mist/70">
                    {ministry.city || ministry.neighborhood}
                    {ministry.zip ? ` ${ministry.zip}` : ""}
                  </p>
                </div>
              </div>
              <div className="border-l-2 border-lemon/40 bg-lemon/[0.06] p-3">
                <p className="text-base leading-relaxed text-mist/90 sm:text-lg">
                  <span className="pr-0.5 text-xl leading-none text-lemon/80" aria-hidden="true">&ldquo;</span>
                  <span className="italic">{ministry.poster.bio}</span>
                  <span className="pl-0.5 text-xl leading-none text-lemon/80" aria-hidden="true">&rdquo;</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-mist/70 sm:text-base">
                <span className="rounded-full px-2.5 py-1 ring-1 ring-mist/20">
                  {ministry.fullTitle || ministry.label}
                </span>
                <span className="rounded-full px-2.5 py-1 ring-1 ring-mist/20">
                  {t("{{count}} likes", { count: live ? likeCount : ministry.likes })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMessageOpen(true)}
                className="inline-flex w-fit items-center gap-1.5 rounded-full bg-lemon/15 px-3 py-1.5 text-sm font-medium text-lemon ring-1 ring-lemon/40 transition hover:bg-lemon/25"
              >
                <Send className="size-4" aria-hidden="true" />
                {t("Message {{name}}", { name: ministry.poster.name.split(" ")[0] })}
              </button>
            </div>
          )}


          <p className="text-xl leading-relaxed text-sand/85 sm:text-2xl">{ministry.description}</p>

          <div className="flex items-center gap-2 border-y border-mist/15 py-3">
            <button
              type="button"
              onClick={() => void handleLike()}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
                liked
                  ? "bg-lemon/15 text-lemon ring-lemon/50"
                  : "text-mist/70 ring-mist/20 hover:bg-ink"
              }`}
              aria-pressed={liked}
            >
              <ThumbsUp className="size-5" aria-hidden="true" />
              {live ? likeCount : ministry.likes + (liked ? 1 : 0)}
            </button>
            <button
              type="button"
              onClick={() => void handleFavorite()}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
                favorited
                  ? "bg-rose/15 text-rose ring-rose/50"
                  : "text-mist/70 ring-mist/20 hover:bg-ink"
              }`}
              aria-pressed={favorited}
              aria-label={favorited ? t("Remove from favorites") : t("Save to favorites")}
            >
              <Heart className="size-5" aria-hidden="true" />
              {live ? (favorited ? t("Saved") : t("Save")) : ministry.favorites + (favorited ? 1 : 0)}
            </button>
            <button
              type="button"
              onClick={() => (live ? setCommentOpen((v) => !v) : undefined)}
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

          {commentOpen && live && (
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
                  placeholder="Leave a kind word"
                  maxLength={500}
                  className="flex-1 rounded-full bg-ink px-4 py-2.5 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                />
                <button
                  type="button"
                  onClick={() => void handleComment()}
                  disabled={busy}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-lemon text-ink disabled:opacity-60"
                  aria-label="Post comment"
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

          {messageOpen && live && (
            <div className="flex flex-col gap-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder={`Write a note to ${ministry.poster.name}`}
                className="rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-5 py-3 text-base font-semibold text-ink disabled:opacity-60"
              >
                {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
                Send message
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-rose/15 px-3 py-2 text-sm text-rose ring-1 ring-rose/30">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                if (!guard()) return;
                setMessageOpen(true);
                setMessageText((t) => t || "Hi! When works for you to meet up?");
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-lemon px-5 py-3 text-base font-semibold text-ink ring-1 ring-lemon/60 transition-transform hover:-translate-y-0.5 sm:text-lg"
            >
              <CalendarClock className="size-5" aria-hidden="true" />
              Let&rsquo;s set a time
            </button>
            <button
              type="button"
              onClick={() => {
                if (!guard()) return;
                setMessageOpen((v) => !v);
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-base font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft sm:text-lg"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
              Message
            </button>
          </div>

          {!live && (
            <p className="text-center text-xs text-mist/50 sm:text-sm">
              This is an example ministry — saving and messaging work on posts from real
              neighbors.
            </p>
          )}
        </div>
      </div>

      {imageLightboxOpen && ministry.poster.photo && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-md"
          onClick={() => setImageLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${ministry.poster.name}'s profile photo`}
        >
          <button
            type="button"
            onClick={() => setImageLightboxOpen(false)}
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-ink/80 text-sand ring-1 ring-mist/20 transition hover:bg-ink"
            aria-label="Close photo"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <img
            src={ministry.poster.photo}
            alt={`Profile photo of ${ministry.poster.name}`}
            className="max-h-[85dvh] max-w-full rounded-2xl object-contain ring-1 ring-mist/20"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
