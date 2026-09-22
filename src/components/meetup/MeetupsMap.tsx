import { useEffect, useRef } from "react";
import { DARK_STYLE, loadMaps } from "@/components/LiveMap";
import type { MyMeetupDTO } from "@/lib/meetups.functions";

/** Dark map with one pin per accepted meetup that has an exact spot. */
export default function MeetupsMap({
  meetups,
  onSelect,
}: {
  meetups: MyMeetupDTO[];
  onSelect: (id: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    const markers: google.maps.Marker[] = [];
    void loadMaps().then(() => {
      if (cancelled || !el.current) return;
      const map = new google.maps.Map(el.current, {
        center: { lat: meetups[0]!.lat!, lng: meetups[0]!.lng! },
        zoom: 14,
        clickableIcons: false,
        disableDefaultUI: true,
        zoomControl: true,
        styles: DARK_STYLE,
      });
      const bounds = new google.maps.LatLngBounds();
      for (const m of meetups) {
        const pos = { lat: m.lat!, lng: m.lng! };
        bounds.extend(pos);
        const mk = new google.maps.Marker({
          position: pos,
          map,
          title: m.otherName,
          label: { text: m.otherName.split(" ")[0] ?? "", color: "#f4ecd8", fontWeight: "600" },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#f2c14e",
            fillOpacity: 1,
            strokeColor: "#1b1726",
            strokeWeight: 3,
            labelOrigin: new google.maps.Point(0, 2.6),
          },
        });
        mk.addListener("click", () => onSelect(m.id));
        markers.push(mk);
      }
      if (meetups.length > 1) map.fitBounds(bounds, 48);
    });
    return () => {
      cancelled = true;
      markers.forEach((m) => m.setMap(null));
    };
  }, [meetups, onSelect]);
  return <div ref={el} className="h-72 w-full overflow-hidden rounded-2xl ring-1 ring-lemon/35" />;
}
