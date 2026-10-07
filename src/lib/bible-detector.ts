import { referenceToUsfm } from "@/lib/bible";

// Common abbreviations -> full book names understood by referenceToUsfm.
const ABBREV: Record<string, string> = {
  gen: "Genesis", ex: "Exodus", exod: "Exodus", lev: "Leviticus", num: "Numbers", deut: "Deuteronomy",
  josh: "Joshua", judg: "Judges", sam: "Samuel", kgs: "Kings", chron: "Chronicles", neh: "Nehemiah",
  esth: "Esther", ps: "Psalm", psa: "Psalm", prov: "Proverbs", eccl: "Ecclesiastes", eccles: "Ecclesiastes",
  isa: "Isaiah", jer: "Jeremiah", lam: "Lamentations", ezek: "Ezekiel", dan: "Daniel", hos: "Hosea",
  obad: "Obadiah", mic: "Micah", nah: "Nahum", hab: "Habakkuk", zeph: "Zephaniah", hag: "Haggai",
  zech: "Zechariah", mal: "Malachi", matt: "Matthew", mt: "Matthew", mk: "Mark", lk: "Luke", jn: "John",
  rom: "Romans", cor: "Corinthians", gal: "Galatians", eph: "Ephesians", phil: "Philippians",
  col: "Colossians", thess: "Thessalonians", tim: "Timothy", tit: "Titus", phlm: "Philemon",
  heb: "Hebrews", jas: "James", pet: "Peter", rev: "Revelation",
};

const REF_RE = /\b([1-3]\s?)?([A-Za-z]+(?:\s(?:of\s)?[A-Za-z]+)?)\.?\s+(\d{1,3}):(\d{1,3})(?:\s?[–—-]\s?(\d{1,3}))?/g;

/** Returns the last valid Bible reference found in free text, normalized (e.g. "1 Corinthians 13:4-7"). */
export function detectLastReference(text: string): string | null {
  let found: string | null = null;
  for (const m of text.matchAll(REF_RE)) {
    const num = m[1] ? `${m[1].trim()} ` : "";
    const words = m[2]!;
    // Try the full captured book name, then only its last word (e.g. "in John").
    const candidates = [words, words.split(/\s+/).pop()!];
    for (const w of candidates) {
      const book = ABBREV[w.toLowerCase()] ?? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      const ref = `${num}${book} ${m[3]}:${m[4]}${m[5] ? `-${m[5]}` : ""}`;
      if (referenceToUsfm(ref)) {
        found = ref;
        break;
      }
    }
  }
  return found;
}
