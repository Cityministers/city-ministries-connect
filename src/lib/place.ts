import type { Ministry } from "@/data/ministries";
import { countryName } from "./country";

/** Extracts a numeric or Canadian postal code from a free-text place query, if present. */
function zipOf(query: string): string | null {
  const match = query.match(/\b(?:\d{4,6}|[a-z]\d[a-z][ -]?\d[a-z]\d)\b/i);
  return match ? match[0] : null;
}

/**
 * True when a ministry belongs to the place the user typed.
 * Matches a ZIP exactly, otherwise matches city or neighborhood text.
 * An empty query matches everything.
 */
export function matchesPlace(ministry: Ministry, query: string, country = "US"): boolean {
  if ((ministry.country ?? "US") !== country) return false;
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return true;

  const zip = zipOf(q);
  if (zip && ministry.zip.toLowerCase() === zip.toLowerCase()) return true;
  if (zip && /^\d+$/.test(q)) return false;

  const words = q
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && w !== "or" && !/^\d+$/.test(w));
  if (words.length === 0) return Boolean(zip) ? ministry.zip === zip : true;

  const haystack = `${ministry.city} ${ministry.neighborhood} ${ministry.zip} ${countryName(ministry.country ?? "US")}`.toLowerCase();
  return words.some((w) => haystack.includes(w));
}

/** Free-text match across a ministry's own content. */
export function matchesText(ministry: Ministry, query: string): boolean {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return true;
  return [
    ministry.label,
    ministry.description,
    ministry.neighborhood,
    ministry.city,
    ministry.zip,
    ministry.poster.name,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}
