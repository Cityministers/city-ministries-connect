/**
 * The badge used for fixed places (churches): the place's own icon on a dark
 * round badge whose pointed tip touches the exact street address.
 * Shared by the live map and the "Add your church" preview.
 */
export function escapeXmlText(value: string): string {
  return value.replace(/[<>&"']/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === '"' ? "&quot;" : "&apos;",
  );
}

export const PLACE_GOLD = "#e8c45c";

export type PlacePin = {
  svg: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  scale: number;
};

export function placePinSvg(glyph: string, title: string): PlacePin {
  const text = escapeXmlText(title);
  const pillWidth = Math.max(80, Math.min(240, text.length * 8.6 + 26));
  const width = Math.max(190, pillWidth + 24);
  const cx = width / 2;
  const height = 110;
  // The tip sits at y=62 — that point lands on the building's coordinates.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <ellipse cx="${cx}" cy="63" rx="9" ry="3.5" fill="rgba(0,0,0,.5)"/>
    <path d="M${cx} 62 L${cx - 8} 47h16z" fill="${PLACE_GOLD}"/>
    <circle cx="${cx}" cy="28" r="23" fill="#171320" stroke="${PLACE_GOLD}" stroke-width="3"/>
    <circle cx="${cx}" cy="28" r="27" fill="none" stroke="${PLACE_GOLD}" stroke-opacity="0.25" stroke-width="2"/>
    <g transform="translate(${cx - 11},17)" fill="none" stroke="${PLACE_GOLD}">${glyph}</g>
    <rect x="${cx - pillWidth / 2}" y="68" width="${pillWidth}" height="27" rx="13.5" fill="#171320" fill-opacity="0.94" stroke="${PLACE_GOLD}" stroke-opacity="0.55"/>
    <text x="${cx}" y="86" text-anchor="middle" font-family="Karla, system-ui, sans-serif" font-size="14" font-weight="700" fill="${PLACE_GOLD}">${text}</text>
  </svg>`;
  return { svg, width, height, anchorX: cx, anchorY: 62, scale: 150 / 180 };
}

export function placePinDataUrl(glyph: string, title: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(placePinSvg(glyph, title).svg)}`;
}
