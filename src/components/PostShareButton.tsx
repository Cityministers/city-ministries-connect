import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Share2 } from "lucide-react";

/**
 * The share pill on a post card. The quick-action row keeps one compact button;
 * tapping it opens the same choices the church page offers — device share sheet
 * when the phone has one, then copy, email, text, Facebook and X.
 *
 * The absolute link is built after mount so server markup never carries a
 * hostname the server cannot know.
 */
export function PostShareButton({
  title,
  text,
  path,
}: {
  title: string;
  text: string;
  path: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(`${window.location.origin}${path}`);
  }, [path]);

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the other choices still work.
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url: shareUrl });
    } catch {
      // Visitor closed the share sheet — nothing to do.
    }
  }

  const note = `${title}${text ? ` — ${text}` : ""}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedNote = encodeURIComponent(note);

  const choice =
    "rounded-full bg-ink px-4 py-2 text-base font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft";

  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t("Share")}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-mist/70 ring-1 ring-mist/20 transition hover:bg-ink"
      >
        {copied ? (
          <Check className="size-5 text-lemon" aria-hidden="true" />
        ) : (
          <Share2 className="size-5" aria-hidden="true" />
        )}
        {copied ? t("Link copied") : t("Share")}
      </button>

      {open && shareUrl && (
        <div className="flex flex-wrap items-center gap-2">
          {canNativeShare && (
            <button
              type="button"
              onClick={() => void nativeShare()}
              className="rounded-full bg-lemon px-4 py-2 text-base font-bold text-ink transition hover:opacity-90"
            >
              {t("Share…")}
            </button>
          )}
          <button type="button" onClick={() => void copyLink()} className={choice}>
            {copied ? t("Link copied") : t("Copy link")}
          </button>
          <a
            href={`mailto:?subject=${encodedNote}&body=${encodedUrl}`}
            className={choice}
          >
            {t("Email")}
          </a>
          <a
            href={`sms:?&body=${encodedNote}%20${encodedUrl}`}
            className={choice}
          >
            {t("Text message")}
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noreferrer"
            className={choice}
          >
            {t("Facebook")}
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedNote}`}
            target="_blank"
            rel="noreferrer"
            className={choice}
          >
            {t("X")}
          </a>
        </div>
      )}
    </div>
  );
}
