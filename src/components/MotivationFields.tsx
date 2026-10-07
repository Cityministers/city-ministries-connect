import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLiveVerseText } from "@/components/ScriptureCard";
import { referenceToUsfm, youVersionUrl } from "@/lib/bible";

/** Optional "My motivation" scripture: type a reference, or look it up on YouVersion and paste. */
export function MotivationFields({
  refValue,
  textValue,
  onRef,
  onText,
  refName,
  textName,
}: {
  refValue: string;
  textValue: string;
  onRef: (v: string) => void;
  onText: (v: string) => void;
  refName?: string;
  textName?: string;
}) {
  const { t } = useTranslation();
  const live = useLiveVerseText(refValue.trim());
  const parsed = refValue.trim() ? referenceToUsfm(refValue.trim()) : null;
  const lookup = refValue.trim()
    ? youVersionUrl(refValue.trim())
    : "https://www.bible.com/bible/114/JHN.1.NIV";
  const field =
    "rounded-xl bg-ink-soft px-4 py-3.5 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50";

  return (
    <fieldset className="flex flex-col gap-2 rounded-2xl p-4 ring-1 ring-mist/20">
      <legend className="px-1 text-sm text-mist/80 sm:text-base">{t("My motivation")} <span className="text-mist/50">({t("optional")})</span></legend>
      <input
        name={refName}
        className={field}
        value={refValue}
        onChange={(e) => onRef(e.target.value)}
        maxLength={60}
        placeholder="Micah 6:8"
        aria-label={t("Bible passage")}
      />
      <a
        href={lookup}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 self-start text-sm font-semibold text-youversion underline-offset-2 hover:underline"
      >
        <BookOpen className="size-4" aria-hidden="true" />
        {t("Look it up on YouVersion")}
      </a>
      <textarea
        name={textName}
        className={`${field} min-h-20`}
        value={textValue}
        onChange={(e) => onText(e.target.value)}
        maxLength={600}
        placeholder={live && parsed ? live : t("Paste the verse text here (optional)")}
        aria-label={t("Verse text")}
      />
      {refValue.trim() && !parsed && (
        <p className="text-xs text-mist/60">{t("Try a format like “John 3:16” so we can link it.")}</p>
      )}
    </fieldset>
  );
}
