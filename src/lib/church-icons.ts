import { Church, Landmark, type LucideProps } from "lucide-react";
import {
  createElement,
  forwardRef as reactForwardRef,
  type ComponentType,
} from "react";

/** Props every selectable church icon accepts (Lucide-compatible). */
export type ChurchIconComponent = ComponentType<{
  className?: string;
  size?: number | string;
  width?: number | string;
  height?: number | string;
  color?: string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  "aria-hidden"?: boolean | "true" | "false";
}>;

/** Build a Lucide-styled icon from a list of path definitions. */
function makeIcon(displayName: string, paths: string[]) {
  const Icon = reactForwardRef<SVGSVGElement, LucideProps>(function Icon(
    { color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, ...rest },
    ref,
  ) {
    const numericSize = Number(size);
    return createElement(
      "svg",
      {
        ref,
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth: absoluteStrokeWidth
          ? (Number(strokeWidth) * 24) / numericSize
          : strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...rest,
      },
      ...paths.map((d, i) => createElement("path", { key: i, d })),
    );
  });
  Object.defineProperty(Icon, "name", { value: displayName });
  return Icon;
}

/** A Latin (Christian) cross: short upper arm, long lower stem. */
export const LatinCross = makeIcon("LatinCross", ["M12 3v18", "M7 9h10"]);

/** Orthodox three-bar cross with the slanted foot rest. */
export const OrthodoxCross = makeIcon("OrthodoxCross", [
  "M12 2v20",
  "M9 5h6",
  "M6 10h12",
  "M8 17l8-3",
]);

/** Onion-dome church, common on Orthodox buildings. */
export const DomeChurch = makeIcon("DomeChurch", [
  "M12 2v2",
  "M12 4c-2.5 1.8-3.5 3.6-3.5 5.2C8.5 11 10 12 12 12s3.5-1 3.5-2.8C15.5 7.6 14.5 5.8 12 4z",
  "M9 12v9",
  "M15 12v9",
  "M5 21V15l4-2",
  "M19 21v-6l-4-2",
  "M3 21h18",
]);

/** Cathedral with twin bell towers and a rose window. */
export const Cathedral = makeIcon("Cathedral", [
  "M12 2v4",
  "M10 4h4",
  "M12 6l4 4v11H8V10z",
  "M12 14.5h.01",
  "M5 21V11l3-2",
  "M19 21V11l-3-2",
  "M3 21h18",
]);

/** The icons a church can choose for its map pin. */
export const CHURCH_ICONS: { id: string; label: string; icon: ChurchIconComponent }[] = [
  { id: "chapel", label: "Chapel", icon: Church },
  { id: "cross", label: "Cross", icon: LatinCross },
  { id: "hall", label: "Meeting hall", icon: Landmark },
  { id: "orthodox", label: "Orthodox cross", icon: OrthodoxCross },
  { id: "dome", label: "Domed church", icon: DomeChurch },
  { id: "cathedral", label: "Cathedral", icon: Cathedral },
];

export function churchIcon(id: string | null | undefined): ChurchIconComponent {
  return CHURCH_ICONS.find((c) => c.id === id)?.icon ?? Church;
}

/** Jewel tone used for church pins so they read differently from posts. */
export const CHURCH_PIN_COLOR = "#e8c45c";
