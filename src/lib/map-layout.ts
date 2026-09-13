import type { Ministry } from "@/data/ministries";
import { matchesPlace } from "@/lib/place";

/** Width of one pin slot (icon + wrapped two-line title). */
const CELL_W = 190;
/** Height of one pin slot. */
const CELL_H = 165;
/** How many pin columns fit inside one ZIP district. */
const COLS = 4;
/** Empty space kept between neighbouring districts. */
const GUTTER = 180;
/** Deterministic wiggle so clusters never look like a spreadsheet. */
const JITTER = 22;

export type PlacedPin = {
  ministry: Ministry;
  x: number;
  y: number;
  districtKey: string;
};

export type District = {
  key: string;
  label: string;
  /** Centre of the district in canvas coordinates. */
  cx: number;
  cy: number;
  count: number;
  members: Ministry[];
};

export type MapLayout = {
  pins: PlacedPin[];
  districts: District[];
  width: number;
  height: number;
};

/** Small stable string hash (FNV-1a), so the same post always lands in the same spot. */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

/** Grid coordinates walking outward in a square spiral: (0,0), (1,0), (1,1)… */
function spiralCell(index: number): { gx: number; gy: number } {
  if (index === 0) return { gx: 0, gy: 0 };
  let x = 0;
  let y = 0;
  let dx = 1;
  let dy = 0;
  let steps = 1;
  let i = 0;
  while (true) {
    for (let leg = 0; leg < 2; leg += 1) {
      for (let s = 0; s < steps; s += 1) {
        x += dx;
        y += dy;
        i += 1;
        if (i === index) return { gx: x, gy: y };
      }
      const nx = -dy;
      dy = dx;
      dx = nx;
    }
    steps += 1;
  }
}

function zipKey(m: Ministry): string {
  const zip = (m.zip ?? "").trim();
  if (zip) return zip;
  return (m.city ?? m.neighborhood ?? "elsewhere").trim().toLowerCase();
}

/**
 * Scatters posts across an endless-feeling canvas, grouped into one patch per ZIP code.
 * Positions are deterministic and slots are spaced so titles never overlap.
 */
export function layoutMap(items: Ministry[]): MapLayout {
  const groups = new Map<string, Ministry[]>();
  for (const m of items) {
    const key = zipKey(m);
    const bucket = groups.get(key);
    if (bucket) bucket.push(m);
    else groups.set(key, [m]);
  }

  const keys = [...groups.keys()].sort((a, b) => {
    const ha = hash(a) % 9973;
    const hb = hash(b) % 9973;
    return ha === hb ? a.localeCompare(b) : ha - hb;
  });

  const maxRows = Math.max(
    2,
    ...keys.map((k) => Math.ceil((groups.get(k)?.length ?? 0) / COLS)),
  );
  const districtW = COLS * CELL_W + GUTTER;
  const districtH = maxRows * CELL_H + GUTTER;

  const cells = keys.map((_, i) => spiralCell(i));
  const minGx = Math.min(...cells.map((c) => c.gx), 0);
  const minGy = Math.min(...cells.map((c) => c.gy), 0);
  const maxGx = Math.max(...cells.map((c) => c.gx), 0);
  const maxGy = Math.max(...cells.map((c) => c.gy), 0);

  const pins: PlacedPin[] = [];
  const districts: District[] = [];

  keys.forEach((key, index) => {
    const members = groups.get(key) ?? [];
    const cell = cells[index]!;
    const originX = (cell.gx - minGx) * districtW + GUTTER / 2;
    const originY = (cell.gy - minGy) * districtH + GUTTER / 2;
    const rows = Math.max(1, Math.ceil(members.length / COLS));
    const cols = Math.min(COLS, Math.max(1, members.length));

    members.forEach((m, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const h = hash(m.id);
      const jx = ((h % 100) / 100 - 0.5) * 2 * JITTER;
      const jy = (((h >> 7) % 100) / 100 - 0.5) * 2 * JITTER;
      pins.push({
        ministry: m,
        districtKey: key,
        x: Math.round(originX + col * CELL_W + CELL_W / 2 + jx),
        y: Math.round(originY + row * CELL_H + CELL_H / 2 + jy),
      });
    });

    const first = members[0];
    districts.push({
      key,
      label: first ? `${first.city}${first.zip ? ` ${first.zip}` : ""}`.trim() : key,
      cx: Math.round(originX + (cols * CELL_W) / 2),
      cy: Math.round(originY + (rows * CELL_H) / 2),
      count: members.length,
      members,
    });
  });

  return {
    pins,
    districts,
    width: (maxGx - minGx + 1) * districtW + GUTTER,
    height: (maxGy - minGy + 1) * districtH + GUTTER,
  };
}

/** Picks the district the typed city or ZIP points at, so the map can glide there. */
export function findDistrict(layout: MapLayout, query: string): District | null {
  const q = String(query ?? "").trim();
  if (!q) return layout.districts[0] ?? null;
  const exact = layout.districts.find((d) => d.key === q.match(/\b\d{5}\b/)?.[0]);
  if (exact) return exact;
  const matched = layout.districts.filter((d) => d.members.some((m) => matchesPlace(m, q)));
  if (matched.length === 0) return layout.districts[0] ?? null;
  return matched.reduce((best, d) => (d.count > best.count ? d : best), matched[0]!);
}
