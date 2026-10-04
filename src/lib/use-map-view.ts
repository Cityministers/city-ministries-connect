import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import type { Ministry } from "@/data/ministries";
import type { MapBounds, MapPoint } from "@/components/LiveMap";
import { lookupPlace } from "@/lib/geo.functions";
import { getMyPlace } from "@/lib/profile.functions";
import { toneHex } from "@/lib/map-tones";
import { iconMarkup } from "@/lib/map-icon";
import { formatMiles, milesBetween, spread, type LatLng } from "@/lib/distance";

/** Downtown Portland, used until a real place is known. */
export const DEFAULT_CENTER: LatLng = { lat: 45.5152, lng: -122.6784 };

/** Turns a typed place into map coordinates, debounced while the user types. */
export function usePlaceCenter(query: string, country = "US"): LatLng {
  const lookup = useServerFn(lookupPlace);
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 500);
    return () => clearTimeout(t);
  }, [query]);

  const { data } = useQuery({
    queryKey: ["place", debounced, country],
    queryFn: () => lookup({ data: { query: debounced, country } }),
    enabled: debounced.trim().length >= 2,
    staleTime: Infinity,
  });
  return data ?? DEFAULT_CENTER;
}

/** Where distances are measured from: the ZIP on the profile, else the searched place. */
export function useHomePoint(signedIn: boolean, fallback: LatLng) {
  const fetchPlace = useServerFn(getMyPlace);
  const lookup = useServerFn(lookupPlace);

  const { data: place } = useQuery({
    queryKey: ["my-place"],
    queryFn: () => fetchPlace(),
    enabled: signedIn,
    staleTime: Infinity,
    retry: false,
    // A signed-out or expired session must not break the map.
    throwOnError: false,
  });

  const homeQuery = [place?.city, place?.zip].filter(Boolean).join(" ").trim();
  const { data: point } = useQuery({
    queryKey: ["place", homeQuery, place?.country],
    queryFn: () => lookup({ data: { query: homeQuery, country: place?.country ?? "US" } }),
    enabled: homeQuery.length >= 2,
    staleTime: Infinity,
  });

  return {
    origin: point ?? fallback,
    hasHome: Boolean(point),
    homeLabel: homeQuery,
  };
}

export type ListedPost = { post: Ministry; miles: number | null; distance: string };

/** Keep map layers and their lists in the area the visitor is actually viewing. */
export function inMapBounds(at: LatLng, bounds: MapBounds | null): boolean {
  if (!bounds) return true;
  const longitudeInside = bounds.west <= bounds.east
    ? at.lng >= bounds.west && at.lng <= bounds.east
    : at.lng >= bounds.west || at.lng <= bounds.east;
  return at.lat >= bounds.south && at.lat <= bounds.north && longitudeInside;
}

/** Pins plus the list that follows them, shared by the ministry and needs maps. */
export function useMapPosts(
  posts: Ministry[],
  origin: LatLng,
  bounds: MapBounds | null,
  mode: "view" | "near",
  ownerId?: string | null,
  highlightId?: string | null,
) {
  return useMemo(() => {
    const located = posts
      .filter((p) => typeof p.lat === "number" && typeof p.lng === "number")
      .map((p) => ({ post: p, at: spread(p.id, { lat: p.lat!, lng: p.lng! }) }));

    const points: MapPoint[] = located.filter(({ post, at }) => post.id === highlightId || inMapBounds(at, bounds)).map(({ post, at }) => ({
      id: post.id,
      lat: at.lat,
      lng: at.lng,
      title: post.label,
      color: toneHex[post.tone],
      glyph: iconMarkup(post.icon),
      owned: Boolean(ownerId && post.ownerId === ownerId),
      highlight: post.id === highlightId,
    }));

    const withDistance: ListedPost[] = located.map(({ post, at }) => {
      const miles = milesBetween(origin, at);
      return { post, miles, distance: formatMiles(miles) };
    });

    const inView =
      bounds === null
        ? withDistance
        : withDistance.filter(({ post }) => {
            const at = spread(post.id, { lat: post.lat!, lng: post.lng! });
            return post.id === highlightId || inMapBounds(at, bounds);
          });

    const list =
      mode === "view"
        ? inView.sort((a, b) => (a.miles ?? 0) - (b.miles ?? 0))
        : [...withDistance].sort((a, b) => (a.miles ?? 0) - (b.miles ?? 0)).slice(0, 30);

    const unplaced = posts.length - located.length;
    return { points, list, unplaced };
  }, [posts, origin, bounds, mode, ownerId, highlightId]);
}
