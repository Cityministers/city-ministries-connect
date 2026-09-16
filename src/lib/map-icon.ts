import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { LucideIcon } from "lucide-react";
import type { ChurchIconComponent } from "@/lib/church-icons";

const cache = new Map<LucideIcon | ChurchIconComponent, string>();

/**
 * Renders an icon (Lucide or custom church icon) to raw SVG markup so it can
 * be drawn inside a map pin. Cached per icon: the markup never changes once produced.
 */
export function iconMarkup(Icon: LucideIcon | ChurchIconComponent): string {
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
