import { useEffect, useRef, useState } from "react";
import { placePinSvg } from "@/lib/place-pin";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  /** Pin colour, matching the post's tone. */
  color: string;
  /** Raw SVG markup for the post's icon, drawn white inside the pin. */
  glyph?: string;
  owned?: boolean;
  highlight?: boolean;
  /** "place" pins sit on an exact street address (churches) instead of a post's area. */
  kind?: "post" | "place";
};

export type MapBounds = { north: number; south: number; east: number; west: number };

type Props = {
  points: MapPoint[];
  center: { lat: number; lng: number };
  zoom?: number;
  onSelect: (id: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  className?: string;
  label?: string;
};

declare global {
  interface Window {
    __cmMapsReady?: Promise<void>;
    __cmMapsCallback?: () => void;
    google?: typeof google;
  }
}

/** Loads the Maps JavaScript API once for the whole app. */
function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.__cmMapsReady) return window.__cmMapsReady;
  window.__cmMapsReady = new Promise<void>((resolve, reject) => {
    const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as
      | string
      | undefined;
    const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as
      | string
      | undefined;
    if (!key) {
      reject(new Error("Map key missing"));
      return;
    }
    window.__cmMapsCallback = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__cmMapsCallback${
      channel ? `&channel=${channel}` : ""
    }`;
    script.async = true;
    script.onerror = () => reject(new Error("Map failed to load"));
    document.head.appendChild(script);
  });
  return window.__cmMapsReady;
}

/** Dark, low-contrast basemap so our own pins stay the brightest thing on screen. */
const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1b1726" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b8aa3" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#14111d" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2438" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3150" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9a97b5" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f1a26" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#201b2d" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#433c5c" }] },
];

/**
 * A dark rounded-square badge holding the ministry's own icon in white,
 * ringed in the post's jewel tone — the same pin language as the splash map.
 */
function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === '"' ? "&quot;" : "&apos;",
  );
}

type PinIcon = {
  url: string;
  scaledSize: google.maps.Size;
  anchor: google.maps.Point;
};

/** A fixed place (church) drawn so its tip rests on the exact address. */
function placeIcon(
  glyph: string | undefined,
  title: string,
  highlight = false,
  phase = 0,
): PinIcon {
  const pin = placePinSvg(
    glyph ?? `<circle cx="11" cy="11" r="7" fill="none"/>`,
    title,
    highlight,
    phase,
  );
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pin.svg)}`,
    scaledSize: new window.google.maps.Size(pin.width * pin.scale, pin.height * pin.scale),
    anchor: new window.google.maps.Point(pin.anchorX * pin.scale, pin.anchorY * pin.scale),
  };
}

function pinIcon(
  color: string,
  owned: boolean,
  highlight: boolean,
  glyph: string | undefined,
  title: string,
  phase = 0,
): PinIcon {
  const ring = owned || highlight ? "#e8c45c" : color;
  const stroke = owned || highlight ? 3 : 2;
  const inner =
    glyph ??
    `<circle cx="0" cy="0" r="7" fill="${color}" transform="translate(11,11)"/>`;
  const text = escapeXml(title);
  const pillWidth = Math.max(72, Math.min(232, text.length * 8.4 + 24));
  const svgWidth = Math.max(180, pillWidth + 24);
  const cx = svgWidth / 2;
  const markerScale = 150 / 180; // keep the original 180×90 pin size proportional
  // A soft gold halo marks a post that was just created, breathing between two sizes.
  const glow = highlight
    ? `<circle cx="${cx}" cy="24" r="${phase ? 33 : 27}" fill="none" stroke="#e8c45c" stroke-width="${
        phase ? 5 : 8
      }" stroke-opacity="${phase ? 0.22 : 0.4}" filter="url(#cmGlow)"/>
       <circle cx="${cx}" cy="24" r="${phase ? 26 : 24}" fill="#e8c45c" fill-opacity="0.12"/>`
    : "";
  const defs = highlight
    ? `<defs><filter id="cmGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="104" viewBox="0 -14 ${svgWidth} 104">
    ${defs}
    ${glow}
    <ellipse cx="${cx}" cy="54" rx="8" ry="3" fill="rgba(0,0,0,.45)"/>
    <path d="M${cx} 52 L${cx - 7} 43h14z" fill="${ring}"/>
    <rect x="${cx - 21}" y="3" width="42" height="42" rx="13" fill="#171320" stroke="${ring}" stroke-width="${stroke}"/>
    <g transform="translate(${cx - 11},13)" fill="none" stroke="#ffffff">${inner}</g>
    <rect x="${cx - pillWidth / 2}" y="58" width="${pillWidth}" height="26" rx="13" fill="#171320" fill-opacity="0.92" stroke="${ring}" stroke-opacity="0.5"/>
    <text x="${cx}" y="76" text-anchor="middle" font-family="Karla, system-ui, sans-serif" font-size="14" font-weight="600" fill="#f4f1ea">${text}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(svgWidth * markerScale, 104 * markerScale),
    anchor: new window.google.maps.Point(cx * markerScale, 58 * markerScale),
  };
}


export function LiveMap({
  points,
  center,
  zoom = 12,
  onSelect,
  onBoundsChange,
  className = "",
  label = "Map of nearby posts",
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markers = useRef(new Map<string, google.maps.Marker>());
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const boundsRef = useRef(onBoundsChange);
  boundsRef.current = onBoundsChange;

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    void loadMaps()
      .then(() => {
        if (cancelled || !hostRef.current || mapRef.current || !window.google) return;
        const map = new window.google.maps.Map(hostRef.current, {
          center,
          zoom,
          clickableIcons: false,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: DARK_STYLE,
        });
        mapRef.current = map;
        map.addListener("idle", () => {
          const b = map.getBounds();
          if (!b || !boundsRef.current) return;
          const ne = b.getNorthEast();
          const sw = b.getSouthWest();
          boundsRef.current({
            north: ne.lat(),
            south: sw.lat(),
            east: ne.lng(),
            west: sw.lng(),
          });
        });
      })
      .catch((err: unknown) => console.error(err));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the searched place.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo(center);
  }, [center.lat, center.lng]);

  // Breathe the halo on a freshly created post.
  const hasHighlight = points.some((p) => p.highlight);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!hasHighlight) {
      setPhase(0);
      return;
    }
    const t = window.setInterval(() => setPhase((v) => (v ? 0 : 1)), 750);
    return () => window.clearInterval(t);
  }, [hasHighlight]);

  // Reconcile pins.
  useEffect(() => {
    let raf = 0;
    const sync = () => {
      const map = mapRef.current;
      if (!map || !window.google) {
        raf = window.setTimeout(sync, 200);
        return;
      }
      const next = new Set(points.map((p) => p.id));
      for (const [id, marker] of markers.current) {
        if (!next.has(id)) {
          marker.setMap(null);
          markers.current.delete(id);
        }
      }
      for (const p of points) {
        const icon =
          p.kind === "place"
            ? placeIcon(p.glyph, p.title, Boolean(p.highlight), phase)
            : pinIcon(
                p.color,
                Boolean(p.owned),
                Boolean(p.highlight),
                p.glyph,
                p.title,
                phase,
              );
        // A highlighted post always sits above its neighbours until it is dismissed.
        // Churches are landmarks, so they stay above ordinary post pins.
        const zIndex = p.highlight
          ? 100000
          : p.kind === "place"
            ? 50000 + Math.round(1000 - p.lat * 10)
            : Math.round(1000 - p.lat * 10);
        const existing = markers.current.get(p.id);
        if (existing) {
          existing.setPosition({ lat: p.lat, lng: p.lng });
          existing.setIcon(icon);
          existing.setTitle(p.title);
          existing.setZIndex(zIndex);
          continue;
        }
        const marker = new window.google.maps.Marker({
          map,
          position: { lat: p.lat, lng: p.lng },
          title: p.title,
          icon,
          zIndex,

          optimized: false,
        });
        marker.addListener("click", () => selectRef.current(p.id));
        markers.current.set(p.id, marker);
      }
    };
    sync();
    return () => window.clearTimeout(raf);
  }, [points, phase]);

  // Tidy up every pin when the map leaves the screen.
  useEffect(() => {
    const live = markers.current;
    return () => {
      for (const marker of live.values()) marker.setMap(null);
      live.clear();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      role="application"
      aria-label={label}
      className={`overflow-hidden rounded-2xl bg-ink-soft ring-1 ring-mist/15 ${className}`}
    />
  );
}
