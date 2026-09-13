import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { LucideIcon } from "lucide-react";

const cache = new Map<LucideIcon, string>();

/**
 * Renders a Lucide icon to raw SVG markup so it can be drawn inside a map pin.
 * Cached per icon: the markup never changes once produced.
 */
export function iconMarkup(Icon: LucideIcon): string {
  const hit = cache.get(Icon);
  if (hit) return hit;
  const markup = renderToStaticMarkup(
    createElement(Icon, {
      width: 22,
      height: 22,
      color: "#ffffff",
      strokeWidth: 2,
      absoluteStrokeWidth: true,
    }),
  );
  cache.set(Icon, markup);
  return markup;
}
