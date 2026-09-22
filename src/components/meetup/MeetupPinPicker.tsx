import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DARK_STYLE, loadMaps } from "@/components/LiveMap";
import { lookupAddress } from "@/lib/geo.functions";
import type { LatLng } from "./MeetupScheduler";

const PORTLAND = { lat: 45.5152, lng: -122.6784 };

/** Small dark map: search an address or drag the pin to the exact spot. */
export default function MeetupPinPicker({
  initialQuery,
  value,
  onChange,
  onDone,
}: {
  initialQuery: string;
  value: LatLng | null;
  onChange: (p: LatLng) => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const lookup = useServerFn(lookupAddress);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.Marker | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMaps()
      .then(() => {
        if (cancelled || !el.current) return;
        const start = value ?? PORTLAND;
        map.current = new google.maps.Map(el.current, {
          center: start,
          zoom: value ? 17 : 13,
          clickableIcons: false,
          disableDefaultUI: true,
          zoomControl: true,
          styles: DARK_STYLE,
          gestureHandling: "greedy",
        });
        marker.current = new google.maps.Marker({ position: start, map: map.current, draggable: true });
        marker.current.addListener("dragend", () => {
          const pos = marker.current?.getPosition();
          if (pos) onChange({ lat: pos.lat(), lng: pos.lng() });
        });
        map.current.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          marker.current?.setPosition(e.latLng);
          onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
        if (!value && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((p) => {
            const here = { lat: p.coords.latitude, lng: p.coords.longitude };
            map.current?.setCenter(here);
            marker.current?.setPosition(here);
          });
        }
      })
      .catch(() => setMsg(t("The map could not load.")));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search() {
    if (query.trim().length < 4) return;
    setBusy(true);
    setMsg(null);
    try {
      const found = await lookup({ data: { query: query.trim() } });
      if (!found) {
        setMsg(t("Couldn't find that address. Try adding the city, or drag the pin."));
        return;
      }
      map.current?.setCenter(found);
      map.current?.setZoom(17);
      marker.current?.setPosition(found);
      onChange(found);
    } catch {
      setMsg(t("Something went wrong."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void search())}
          placeholder={t("Street address")}
          className="min-w-0 flex-1 rounded-xl bg-ink-soft px-4 py-3 text-base text-sand ring-1 ring-mist/25 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void search()}
          aria-label={t("Search")}
          className="grid size-12 place-items-center rounded-xl bg-lemon text-ink"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
        </button>
      </div>
      <div ref={el} className="h-64 w-full overflow-hidden rounded-xl ring-1 ring-mist/25" />
      <p className="text-sm text-mist/70">{msg ?? t("Tap the map or drag the pin to the exact spot.")}</p>
      <button
        type="button"
        onClick={() => {
          const pos = marker.current?.getPosition();
          if (pos) onChange({ lat: pos.lat(), lng: pos.lng() });
          onDone();
        }}
        className="rounded-xl bg-tone-emerald/25 px-4 py-3 text-lg font-semibold text-sand ring-1 ring-tone-emerald/55"
      >
        {t("Use this spot")}
      </button>
    </div>
  );
}
