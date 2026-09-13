import { useEffect, useRef } from "react";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  /** Pin colour, matching the post's tone. */
  color: string;
  owned?: boolean;
  highlight?: boolean;
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

function pinIcon(color: string, owned: boolean, highlight: boolean): string {
  const ring = owned || highlight ? "#e8c45c" : "#2b2438";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
    <g>
      <ellipse cx="22" cy="48" rx="7" ry="3" fill="rgba(0,0,0,.45)"/>
      <path d="M22 47c0-9 12-13 12-25a12 12 0 1 0-24 0c0 12 12 16 12 25z" fill="${ring}"/>
      <circle cx="22" cy="21" r="8.5" fill="${color}"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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
        const icon = {
          url: pinIcon(p.color, Boolean(p.owned), Boolean(p.highlight)),
          scaledSize: new window.google.maps.Size(36, 43),
          anchor: new window.google.maps.Point(18, 43),
        };
        const existing = markers.current.get(p.id);
        if (existing) {
          existing.setPosition({ lat: p.lat, lng: p.lng });
          existing.setIcon(icon);
          existing.setTitle(p.title);
          continue;
        }
        const marker = new window.google.maps.Marker({
          map,
          position: { lat: p.lat, lng: p.lng },
          title: p.title,
          icon,
          optimized: false,
        });
        marker.addListener("click", () => selectRef.current(p.id));
        markers.current.set(p.id, marker);
      }
    };
    sync();
    return () => window.clearTimeout(raf);
  }, [points]);

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
