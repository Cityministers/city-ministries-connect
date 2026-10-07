import { useEffect, useState } from "react";
import { BookOpen, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLiveVerseText } from "@/components/ScriptureCard";
import { detectLastReference } from "@/lib/bible-detector";
import { youVersionUrl } from "@/lib/bible";

/**
 * Watches a draft for a Bible reference (e.g. "John 3:16") and offers to insert the
 * verse text or attach it as the post's scripture. Nothing is fetched until a
 * reference is detected, and nothing changes unless the member taps an action.
 */
export function ScriptureDetectorPill({
  text,
  onInsert,
  onAttach,
  maxLength,
}: {
  text: string;
  onInsert: (next: string) => void;
  onAttach?: (reference: string, verseText: string) => void;
  maxLength?: number;
}) {
  const { t } = useTranslation();
  const [ref, setRef] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setRef(detectLastReference(text)), 400);
    return () => clearTimeout(id);
  }, [text]);

  const verse = useLiveVerseText(ref ?? "");
  if (!ref || dismissed === ref) return null;

  const quote = verse ? ` "${verse}" (${ref} NIV)` : "";
  const alreadyIn = verse ? text.includes(verse) : false;
  const fits = !maxLength || text.length + quote.length <= maxLength;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ink-soft/70 px-3 py-2 text-sm ring-1 ring-lemon/30">
      <BookOpen className="size-4 text-lemon" aria-hidden="true" />
      <span className="font-semibold text-sand">{t("Found")} {ref}</span>
      {verse && !alreadyIn && fits && (
        <button
          type="button"
          onClick={() => onInsert(text.trimEnd() + quote)}
          className="rounded-full bg-lemon/15 px-3 py-1 font-semibold text-lemon hover:bg-lemon/25"
        >
          {t("Insert verse")}
        </button>
      )}
      {onAttach && (
        <button
          type="button"
          onClick={() => {
            onAttach(ref, verse ?? "");
            setDismissed(ref);
          }}
          className="rounded-full bg-lemon/15 px-3 py-1 font-semibold text-lemon hover:bg-lemon/25"
        >
          {t("Use as My motivation")}
        </button>
      )}
      <a
        href={youVersionUrl(ref)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-youversion underline-offset-2 hover:underline"
      >
        {t("Read on YouVersion")}
      </a>
      <button
        type="button"
        onClick={() => setDismissed(ref)}
        aria-label={t("Dismiss")}
        className="ml-auto rounded-full p-1 text-mist/70 hover:text-sand"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
