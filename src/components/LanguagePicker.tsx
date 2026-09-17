import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LANGUAGES,
  applyLanguage,
  savedLanguage,
  updateDocumentLang,
  type LanguageCode,
} from "@/lib/i18n";

export function LanguagePicker({ variant = "button" }: { variant?: "button" | "pill" }) {
  const { i18n } = useTranslation();
  const [current, setCurrent] = useState<LanguageCode>(() => savedLanguage());

  useEffect(() => {
    if (i18n.language && i18n.language !== current) setCurrent(i18n.language as LanguageCode);
  }, [i18n.language, current]);

  const choose = async (code: LanguageCode) => {
    setCurrent(code);
    updateDocumentLang(code);
    await applyLanguage(code);
  };

  if (variant === "pill") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-lighter bg-slate px-5 py-3.5 text-lg font-semibold text-sand shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] transition hover:bg-slate-light active:translate-y-0.5"
            aria-label="Choose language"
          >
            <Globe className="size-5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{current.toUpperCase()}</span>
          </button>
        </DropdownMenuTrigger>
        <LanguageMenu current={current} onChoose={choose} />
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
          aria-label="Choose language"
        >
          <Globe className="size-5" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <LanguageMenu current={current} onChoose={choose} />
    </DropdownMenu>
  );
}

function LanguageMenu({
  current,
  onChoose,
}: {
  current: LanguageCode;
  onChoose: (code: LanguageCode) => void;
}) {
  return (
    <DropdownMenuContent
      align="end"
      sideOffset={8}
      className="max-h-[70vh] w-56 overflow-y-auto border-ink-soft bg-ink-soft/95 text-sand backdrop-blur"
    >
      {LANGUAGES.map((lang) => (
        <DropdownMenuItem
          key={lang.code}
          onSelect={() => onChoose(lang.code)}
          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-base data-[highlighted]:bg-ink data-[highlighted]:text-sand"
        >
          <span>{lang.name}</span>
          {current === lang.code ? (
            <Check className="size-4 text-lemon" aria-hidden="true" />
          ) : null}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  );
}
