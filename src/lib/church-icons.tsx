import { Church, Landmark, forwardRef, type ComponentType, type LucideProps } from "lucide-react";
import { forwardRef as reactForwardRef } from "react";

/** Props every selectable church icon accepts (Lucide-compatible). */
export type ChurchIconComponent = ComponentType<{
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  "aria-hidden"?: boolean | "true" | "false";
}>;

/**
 * A Latin (Christian) cross: short upper arm, long lower stem.
 * Drawn in the same stroke style as Lucide icons so it matches the others.
 */
export const LatinCross = reactForwardRef<SVGSVGElement, LucideProps>(
  function LatinCross(
    { color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, ...rest },
    ref,
  ) {
    const numericSize = Number(size);
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={
          absoluteStrokeWidth ? (Number(strokeWidth) * 24) / numericSize : strokeWidth
        }
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        <path d="M12 3v18" />
        <path d="M7 9h10" />
      </svg>
    );
  },
);

/** The three icons a church can choose for its map pin. */
export const CHURCH_ICONS: { id: string; label: string; icon: ChurchIconComponent }[] = [
  { id: "chapel", label: "Chapel", icon: Church },
  { id: "cross", label: "Cross", icon: LatinCross },
  { id: "hall", label: "Meeting hall", icon: Landmark },
];

export function churchIcon(id: string | null | undefined): ChurchIconComponent {
  return CHURCH_ICONS.find((c) => c.id === id)?.icon ?? Church;
}

/** Jewel tone used for church pins so they read differently from posts. */
export const CHURCH_PIN_COLOR = "#e8c45c";
