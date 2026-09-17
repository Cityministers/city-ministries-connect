import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { translateTexts } from "@/lib/translate.functions";

/**
 * Renders a short text in the visitor's chosen language when a translation
 * is available, falling back to the original. Uses the server-side
 * translation memory, so each unique string is translated only once.
 */
export function AutoText({ text, className }: { text: string; className?: string }) {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "en").split("-")[0];
  const translate = useServerFn(translateTexts);
  const [out, setOut] = useState<string | null>(null);

  useEffect(() => {
    setOut(null);
    if (lang === "en" || !text) return;
    let cancelled = false;
    translate({
      data: { lang, items: [{ key: "text", text: text.slice(0, 3000) }] },
    })
      .then((res) => {
        if (!cancelled && res.translations["text"]) setOut(res.translations["text"]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lang, text, translate]);

  return <span className={className}>{out ?? text}</span>;
}
