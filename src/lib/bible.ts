// Builds a real YouVersion (bible.com) Bible study URL from a scripture
// reference like "Hebrews 10:24–25" -> https://www.bible.com/bible/59/HEB.10.24.ESV
// Version 59 = ESV on YouVersion.

const BOOK_IDS: Record<string, string> = {
  genesis: "GEN",
  exodus: "EXO",
  leviticus: "LEV",
  numbers: "NUM",
  deuteronomy: "DEU",
  joshua: "JOS",
  judges: "JDG",
  ruth: "RUT",
  "1 samuel": "1SA",
  "2 samuel": "2SA",
  "1 kings": "1KI",
  "2 kings": "2KI",
  "1 chronicles": "1CH",
  "2 chronicles": "2CH",
  ezra: "EZR",
  nehemiah: "NEH",
  esther: "EST",
  job: "JOB",
  psalm: "PSA",
  psalms: "PSA",
  proverbs: "PRO",
  ecclesiastes: "ECC",
  "song of solomon": "SNG",
  isaiah: "ISA",
  jeremiah: "JER",
  lamentations: "LAM",
  ezekiel: "EZK",
  daniel: "DAN",
  hosea: "HOS",
  joel: "JOL",
  amos: "AMO",
  obadiah: "OBA",
  jonah: "JON",
  micah: "MIC",
  nahum: "NAM",
  habakkuk: "HAB",
  zephaniah: "ZEP",
  haggai: "HAG",
  zechariah: "ZEC",
  malachi: "MAL",
  matthew: "MAT",
  mark: "MRK",
  luke: "LUK",
  john: "JHN",
  acts: "ACT",
  romans: "ROM",
  "1 corinthians": "1CO",
  "2 corinthians": "2CO",
  galatians: "GAL",
  ephesians: "EPH",
  philippians: "PHP",
  colossians: "COL",
  "1 thessalonians": "1TH",
  "2 thessalonians": "2TH",
  "1 timothy": "1TI",
  "2 timothy": "2TI",
  titus: "TIT",
  philemon: "PHM",
  hebrews: "HEB",
  james: "JAS",
  "1 peter": "1PE",
  "2 peter": "2PE",
  "1 john": "1JN",
  "2 john": "2JN",
  "3 john": "3JN",
  jude: "JUD",
  revelation: "REV",
};

/**
 * Returns a YouVersion URL for a reference such as "Galatians 6:2" or
 * "Luke 14:13–14". Falls back to a YouVersion search URL when the
 * reference can't be parsed.
 */
export function youVersionUrl(reference: string): string {
  const match = reference
    .trim()
    .match(/^([1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)?)\s+(\d+):(\d+)/);
  if (!match) {
    return `https://www.bible.com/search?q=${encodeURIComponent(reference)}`;
  }
  const book = BOOK_IDS[match[1]!.toLowerCase()];
  if (!book) {
    return `https://www.bible.com/search?q=${encodeURIComponent(reference)}`;
  }
  return `https://www.bible.com/bible/59/${book}.${match[2]!}.${match[3]!}.ESV`;
}
