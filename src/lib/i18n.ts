import i18next from "i18next";
import { initReactI18next } from "react-i18next";

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "fr", name: "Français" },
  { code: "ko", name: "한국어" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "ru", name: "Русский" },
  { code: "zh", name: "简体中文" },
  { code: "ar", name: "العربية" },
  { code: "tl", name: "Tagalog" },
  { code: "ht", name: "Kreyòl Ayisyen" },
  { code: "am", name: "አማርኛ" },
  { code: "so", name: "Soomaali" },
  { code: "uk", name: "Українська" },
  { code: "hi", name: "हिन्दी" },
  { code: "ja", name: "日本語" },
  { code: "sw", name: "Kiswahili" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "pl", name: "Polski" },
  { code: "fa", name: "فارسی" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const RTL_LANGS = new Set<string>(["ar", "fa"]);

const LANGUAGE_CODES = new Set<string>(LANGUAGES.map((l) => l.code));
const loadedLanguages = new Set<string>(["en"]);

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    supportedLngs: [...LANGUAGE_CODES],
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    resources: { en: { translation: {} } },
  });
}

/** The visitor's saved language, from browser storage only (never during SSR). */
export function savedLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem("cm_lang");
    if (stored && LANGUAGE_CODES.has(stored)) return stored as LanguageCode;
    const match = document.cookie.match(/(?:^|;\s*)cm_lang=([a-z-]+)/);
    if (match?.[1] && LANGUAGE_CODES.has(match[1])) return match[1] as LanguageCode;
  } catch {
    // storage unavailable — default to English
  }
  return "en";
}

export async function ensureLanguageBundle(code: string) {
  if (loadedLanguages.has(code)) return;
  const mod = await import(`../locales/${code}.json`);
  i18next.addResourceBundle(
    code,
    "translation",
    (mod as { default?: Record<string, string> }).default ?? (mod as Record<string, string>),
    true,
    true,
  );
  loadedLanguages.add(code);
}

export function persistLanguage(code: string) {
  try {
    localStorage.setItem("cm_lang", code);
    document.cookie = `cm_lang=${code};path=/;max-age=31536000;samesite=lax`;
  } catch {
    // storage unavailable
  }
}

export function updateDocumentLang(code: string) {
  document.documentElement.lang = code;
  document.documentElement.dir = RTL_LANGS.has(code) ? "rtl" : "ltr";
}

/** Load the language bundle, switch the UI, remember the choice, set lang/dir. */
export async function applyLanguage(code: LanguageCode) {
  await ensureLanguageBundle(code);
  await i18next.changeLanguage(code);
  persistLanguage(code);
  updateDocumentLang(code);
}
