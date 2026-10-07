import { useEffect, useState } from "react";
import { BookOpen, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePassage } from "@youversion/platform-react-hooks";
import { detectLastReference } from "@/lib/bible-detector";
import { referenceToUsfm } from "@/lib/bible";
import { HAS_YOUVERSION_APP_KEY, INSERTION_BIBLE_VERSION_ID, INSERTION_BIBLE_LABEL } from "@/lib/youversion";
import { Button } from "@/components/ui/button";

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
  onAttach?: ((reference: string, verseText: string) => void) | undefined;
  maxLength?: number | undefined;
}) {
  const { t } = useTranslation();
  const [ref, setRef] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setRef(detectLastReference(text)), 400);
    return () => clearTimeout(id);
  }, [text]);

  const usfm = referenceToUsfm(ref ?? "");
  const { passage, loading, refetch } = usePassage({
    versionId: INSERTION_BIBLE_VERSION_ID,
    usfm: usfm ?? "",
    format: "text",
    options: { enabled: HAS_YOUVERSION_APP_KEY && Boolean(usfm) },
  });
  const verse = passage?.id === usfm ? passage.content?.trim() : undefined;
  if (!ref || dismissed === ref) return null;

  const quote = verse ? ` "${verse}" (${ref} ${INSERTION_BIBLE_LABEL})` : "";
  const alreadyIn = verse ? text.includes(verse) : false;
  const fits = !maxLength || text.length + quote.length <= maxLength;

  return (
    <div className="mx-3 mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-ink-soft/70 px-3 py-2 text-sm ring-1 ring-lemon/30" role="group" aria-label={t("Scripture completion")}>
      <BookOpen className="size-4 text-lemon" aria-hidden="true" />
      <span className="font-semibold text-sand">{t("Found")} {ref}</span>
      {!alreadyIn && (
        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled={!verse || !fits}
          title={!fits ? t("This verse exceeds the character limit.") : undefined}
          onClick={() => onInsert(text.trimEnd() + quote)}
          className="h-7 rounded-full bg-lemon/15 px-3 py-1 font-semibold text-lemon hover:bg-lemon/25 hover:text-lemon"
        >
          {loading ? t("Loading verse…") : t("Insert Verse")}
        </Button>
      )}
      {onAttach && (
        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled={!verse}
          onClick={() => {
            if (!verse) return;
            onAttach(`${ref} (${INSERTION_BIBLE_LABEL})`, verse);
            setDismissed(ref);
          }}
          className="rounded-full bg-lemon/15 px-3 py-1 font-semibold text-lemon hover:bg-lemon/25"
        >
          {t("Use as My motivation")}
        </Button>
      )}
      <a
        href={`https://www.bible.com/bible/${INSERTION_BIBLE_VERSION_ID}/${usfm}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-youversion underline-offset-2 hover:underline"
      >
        {t("Read on YouVersion")}
      </a>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => setDismissed(ref)}
        aria-label={t("Dismiss")}
        className="ml-auto size-7 shrink-0 rounded-full p-1 text-mist/70 hover:text-sand"
      >
        <X className="size-4" />
      </Button>
      {verse && <span className="text-xs text-mist/70">{INSERTION_BIBLE_LABEL}</span>}
      {!verse && !loading && <span className="w-full text-xs text-mist/70">{t("Could not load this verse.")} <Button type="button" variant="ghost" size="sm" onClick={refetch}>{t("Try again")}</Button></span>}
    </div>
  );
}
