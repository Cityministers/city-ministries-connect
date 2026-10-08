// YouVersion Platform Search APIs: topics (GET /v1/search-topics) and the
// topical verses for a topic (GET /v1/search-verses, user_intent=topical).
import { INSERTION_BIBLE_VERSION_ID, YOUVERSION_APP_KEY } from "@/lib/youversion";

const HOST = "https://api.youversion.com";

export type YVTopic = { id: number | null; text: string; subtopics: string[] };

async function yvGet(path: string, params: Record<string, string | number>): Promise<any> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) qs.append(k, String(v));
  const res = await fetch(`${HOST}${path}?${qs.toString()}`, {
    headers: { "X-YVP-App-Key": YOUVERSION_APP_KEY, "X-YVP-Installation-Id": "web-sdk-default" },
  });
  if (!res.ok) throw new Error(`YouVersion ${path} ${res.status}`);
  return res.json();
}

/** Topics related to a query, used to pivot to other verses on the same topic. */
export async function searchTopics(query: string): Promise<YVTopic[]> {
  const q = query.trim().slice(0, 100);
  if (!q) return [];
  const data = await yvGet("/v1/search-topics", { query: q, "language_ranges[]": "en" });
  return ((data?.topics ?? []) as any[]).map((t) => ({
    id: typeof t.id === "number" ? t.id : null,
    text: String(t.text ?? ""),
    subtopics: Array.isArray(t.subtopics) ? t.subtopics.map(String) : [],
  }));
}

/** Topic search across several rant keywords, de-duplicated by topic label. */
export async function topicsForKeywords(keywords: string[]): Promise<YVTopic[]> {
  const results = await Promise.all(keywords.slice(0, 6).map((k) => searchTopics(k).catch(() => [])));
  const seen = new Map<string, YVTopic>();
  for (const list of results) for (const t of list) if (t.text && !seen.has(t.text)) seen.set(t.text, t);
  return [...seen.values()].slice(0, 6);
}

/** USFM ids (e.g. "PHP.4.6") of the topical verses for a topic or subtopic. */
export async function topicalVerses(query: string, pageSize = 4): Promise<string[]> {
  const data = await yvGet("/v1/search-verses", {
    query: query.trim().slice(0, 100),
    bible_id: INSERTION_BIBLE_VERSION_ID,
    user_intent: "topical",
    page_size: pageSize,
  });
  return ((data?.verses ?? []) as any[]).map((v) => String(v.reference ?? "")).filter(Boolean).slice(0, pageSize);
}
