import { useEffect, useState } from "react";
import { BookOpen, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLiveVerseText } from "@/components/ScriptureCard";
import { detectLastReference } from "@/lib/bible-detector";
import { youVersionUrl } from "@/lib/bible";
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

  const verse = useLiveVerseText(ref ?? "");
  if (!ref || dismissed === ref) return null;

  const quote = verse ? ` "${verse}" (${ref} NIV)` : "";
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
          title={!fits ? t("This verse exceeds the character limit.") : !verse ? t("Live NIV text is currently unavailable. You can copy it from YouVersion.") : undefined}
          onClick={() => onInsert(text.trimEnd() + quote)}
          className="h-7 rounded-full bg-lemon/15 px-3 py-1 font-semibold text-lemon hover:bg-lemon/25 hover:text-lemon"
        >
          {t("Display verse")}
        </Button>
      )}
      {onAttach && (
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => {
            onAttach(ref, verse ?? "");
            setDismissed(ref);
          }}
          className="rounded-full bg-lemon/15 px-3 py-1 font-semibold text-lemon hover:bg-lemon/25"
        >
          {t("Use as My motivation")}
        </Button>
      )}
      <a
        href={youVersionUrl(ref)}
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
      {!verse && <span className="w-full text-xs text-mist/70">{t("Live NIV text is currently unavailable. You can copy it from YouVersion.")}</span>}
    </div>
  );
}
