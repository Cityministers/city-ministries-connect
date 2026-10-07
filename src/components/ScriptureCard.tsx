import { usePassage } from "@youversion/platform-react-hooks";
import { NIV_VERSION_ID, referenceToUsfm, youVersionUrl } from "@/lib/bible";
import { HAS_YOUVERSION_APP_KEY } from "@/lib/youversion";

/**
 * Renders one scripture passage.
 *
 * With an active, NIV-licensed YouVersion app key the NIV text is pulled live
 * from the YouVersion API. Until the key's NIV license is approved (the API
 * answers 403 for NIV content), or if any lookup fails, we show the stored
 * NIV quote with a link to the same passage on bible.com, so the section
 * never goes blank.
 */
export function ScriptureCard({
  reference,
  fallbackText,
}: {
  reference: string;
  fallbackText?: string;
}) {
  const usfm = referenceToUsfm(reference);
  const { passage } = usePassage({
    versionId: NIV_VERSION_ID,
    usfm: usfm ?? "",
    format: "text",
    options: { enabled: HAS_YOUVERSION_APP_KEY && Boolean(usfm) },
  });

  const liveText =
    passage && typeof passage.content === "string" && passage.content.trim()
      ? passage.content.trim()
      : null;

  const text = liveText ?? fallbackText;

  return (
    <blockquote className="rounded-2xl bg-ink-soft/60 p-5 ring-1 ring-mist/15">
      {text && (
        <p className="text-lg italic leading-relaxed text-sand/90 sm:text-xl">
          “{text}”
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <cite className="text-base font-semibold not-italic text-lemon">
          — {reference} · NIV
        </cite>
        <a
          href={youVersionUrl(reference)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-youversion underline-offset-2 hover:underline"
        >
          Read in context
        </a>
      </div>
    </blockquote>
  );
}
