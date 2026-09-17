import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { translateTexts } from "@/lib/translate.functions";

export type TranslatedPair = {
  /** Translated title (or the original when unavailable). */
  title: string;
  /** Translated description (or the original when unavailable). */
  description: string | null;
  /** True while the translation is being fetched. */
  loading: boolean;
  /** True when a translation is available (whether currently shown or not). */
  hasTranslation: boolean;
  /** True when the translated text is currently displayed. */
  showingTranslation: boolean;
  /** Toggle between the translation and the original text. */
  toggle: () => void;
};

/**
 * Auto-translates a post's title and description into the visitor's chosen
 * language, with a "see original" toggle. English is always shown as-is.
 */
export function useTranslatedPost(title: string, description: string | null): TranslatedPair {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "en").split("-")[0];
  const translate = useServerFn(translateTexts);

  const [showOriginal, setShowOriginal] = useState(false);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "error" | "ready">("idle");

  useEffect(() => {
    setShowOriginal(false);
    setTexts({});
    if (lang === "en") {
      setState("idle");
      return;
    }
    let cancelled = false;
    setState("loading");
    translate({
      data: {
        lang,
        items: [
          { key: "title", text: title.slice(0, 3000) },
          ...(description ? [{ key: "description", text: description.slice(0, 3000) }] : []),
        ],
      },
    })
      .then((res) => {
        if (cancelled) return;
        if (res.error || !res.translations["title"]) {
          setState("error");
        } else {
          setTexts(res.translations);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [lang, title, description, translate]);

  const failed = state === "error";
  const translatedAvailable = state === "ready" && !showOriginal;
  const displayTitle =
    lang !== "en" && translatedAvailable && texts["title"] ? texts["title"] : title;
  const displayDescription =
    lang !== "en" && translatedAvailable && texts["description"]
      ? texts["description"]
      : description;

  return {
    title: displayTitle,
    description: displayDescription,
    loading: lang !== "en" && state === "loading",
    hasTranslation: lang !== "en" && state === "ready" && !failed,
    showingTranslation: lang !== "en" && translatedAvailable,
    toggle: () => setShowOriginal((v) => !v),
  };
}
